import express from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = express.Router();

// Configure Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILE_PATH // Path to your service account key JSON
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Configure multer for memory storage (we'll upload directly to GCS)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only .doc and .docx files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.doc' || ext === '.docx') {
            cb(null, true);
        } else {
            cb(new Error('Only .doc and .docx files are allowed'));
        }
    }
});

// POST /upload endpoint
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate random filename with original extension
        const ext = path.extname(req.file.originalname);
        const randomFilename = `${uuidv4()}${ext}`;

        // Create a new blob in the bucket
        const blob = bucket.file(randomFilename);

        // Create a write stream
        const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    uploadedAt: new Date().toISOString()
                }
            }
        });

        // Handle errors
        blobStream.on('error', (err) => {
            console.error('Upload error:', err);
            next(err);
        });

        // Handle successful upload
        blobStream.on('finish', async () => {
            // Generate a signed URL (valid for 7 days) instead of making file public
            // This works with uniform bucket-level access
            const [signedUrl] = await blob.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({
                success: true,
                url: signedUrl,
                filename: randomFilename,
                originalName: req.file.originalname,
                size: req.file.size
            });
        });

        // Upload the file buffer
        blobStream.end(req.file.buffer);

    } catch (error) {
        console.error('Upload error:', error);
        next(error);
    }
});

// Health check for upload service
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Upload service ready',
        bucket: process.env.GCS_BUCKET_NAME
    });
});

export default router;

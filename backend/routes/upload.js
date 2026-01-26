import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client only if credentials are provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );
    console.log('✅ Supabase client initialized');
} else {
    console.log('⚠️ Supabase not configured - file upload via /upload will be disabled');
}

// Configure multer for file upload (10MB limit, memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB in bytes
    },
    fileFilter: (req, file, cb) => {
        // Validate MIME type for .doc and .docx files
        const allowedMimeTypes = [
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only .doc and .docx files are allowed.'), false);
        }
    },
});

// POST /upload endpoint
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                error: 'File upload service not configured',
                details: 'Supabase credentials not provided'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get userId from request body or query param (fallback to 'default' for testing)
        const userId = req.body.userId || req.query.userId || 'default';

        // Generate unique filename with UUID
        const fileExtension = req.file.originalname.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;

        // Construct storage path: /users/{userId}/{uniqueFilename}
        const storagePath = `users/${userId}/${uniqueFilename}`;

        console.log(`📤 Uploading file: ${storagePath}`);

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(process.env.SUPABASE_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false, // Don't overwrite existing files
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({
                error: 'Failed to upload file to storage',
                details: uploadError.message
            });
        }

        // Generate signed URL with 1 hour expiry
        const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from(process.env.SUPABASE_BUCKET)
            .createSignedUrl(storagePath, 3600); // 3600 seconds = 1 hour

        if (signedUrlError) {
            console.error('Signed URL error:', signedUrlError);
            return res.status(500).json({
                error: 'File uploaded but failed to generate download URL',
                details: signedUrlError.message
            });
        }

        console.log(`✅ File uploaded successfully: ${storagePath}`);

        // Return success response with file metadata
        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                originalName: req.file.originalname,
                filename: uniqueFilename,
                path: storagePath,
                size: req.file.size,
                mimeType: req.file.mimetype,
                downloadUrl: signedUrlData.signedUrl,
                expiresIn: 3600, // seconds
            },
        });

    } catch (error) {
        next(error);
    }
});

export default router;

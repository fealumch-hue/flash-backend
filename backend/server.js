import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - permissive for development
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint - MUST BE FIRST
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Flash Backend API Running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Pulse AI Upload Server Running' });
});

// Upload routes
app.use('/upload', uploadRouter);

// Conditionally load GCS upload route if configured
if (process.env.GCS_BUCKET_NAME && process.env.GCS_BUCKET_NAME !== 'your-bucket-name-here') {
    import('./routes/upload-gcs.js').then((module) => {
        app.use('/upload-word', module.default);
        console.log('✅ GCS Word upload route enabled');
    }).catch(err => {
        console.log('⚠️ GCS upload route not loaded:', err.message);
    });
} else {
    console.log('⚠️ GCS not configured - Word upload disabled');
    // Provide a fallback endpoint that returns an error
    app.post('/upload-word', (req, res) => {
        res.status(503).json({
            error: 'Word document upload is not configured. Please set up Google Cloud Storage.',
            instructions: 'See WORD_UPLOAD_SETUP.md for setup instructions'
        });
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS: Enabled for all origins`);
});

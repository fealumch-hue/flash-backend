import React from 'react';
import { createRoot } from 'react-dom/client';
import FileUpload from './components/FileUpload';

function UploadDemo() {
    return (
        <div style={{ minHeight: '100vh', background: '#1a1a2e', padding: '2rem' }}>
            <h1 style={{ textAlign: 'center', color: 'white', marginBottom: '2rem' }}>
                Pulse AI - File Upload System Demo
            </h1>
            <FileUpload
                userId="demo-user"
                onUploadSuccess={(file) => {
                    console.log('Upload successful:', file);
                    alert(`File uploaded successfully!\nDownload URL: ${file.downloadUrl}`);
                }}
                onUploadError={(error) => {
                    console.error('Upload error:', error);
                }}
            />
        </div>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<UploadDemo />);
}

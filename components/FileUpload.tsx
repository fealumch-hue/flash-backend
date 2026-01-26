import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, XCircle, Loader } from 'lucide-react';
import { uploadFile } from '../services/uploadService';
import type { UploadProgress, UploadedFile, UploadError } from '../types';

interface FileUploadProps {
    userId?: string;
    onUploadSuccess?: (file: UploadedFile) => void;
    onUploadError?: (error: UploadError) => void;
}

export default function FileUpload({ userId, onUploadSuccess, onUploadError }: FileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadedFile(null);
            setError(null);
            setProgress(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setProgress({ loaded: 0, total: 0, percentage: 0 });

        try {
            const response = await uploadFile(selectedFile, {
                userId,
                onProgress: (prog) => {
                    setProgress(prog);
                },
            });

            setUploadedFile(response.file);
            onUploadSuccess?.(response.file);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setSelectedFile(null);
        } catch (err) {
            const uploadError = err as UploadError;
            setError(uploadError.details || uploadError.error);
            onUploadError?.(uploadError);
        } finally {
            setUploading(false);
            setProgress(null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="file-upload-container">
            <div className="upload-card">
                <div className="upload-header">
                    <Upload className="upload-icon" size={32} />
                    <h2>Upload Document</h2>
                    <p>Upload .doc or .docx files (max 10MB)</p>
                </div>

                {/* File Input */}
                <div className="file-input-wrapper">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="file-input"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="file-input-label">
                        <File size={20} />
                        {selectedFile ? selectedFile.name : 'Choose a file'}
                    </label>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                    <div className="file-info">
                        <div className="file-details">
                            <span className="file-name">{selectedFile.name}</span>
                            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="upload-button"
                        >
                            {uploading ? (
                                <>
                                    <Loader className="spinner" size={16} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Upload File
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                {progress && uploading && (
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                        <span className="progress-text">{progress.percentage}%</span>
                    </div>
                )}

                {/* Success Message */}
                {uploadedFile && (
                    <div className="upload-success">
                        <CheckCircle className="success-icon" size={20} />
                        <div className="success-content">
                            <p className="success-title">File uploaded successfully!</p>
                            <p className="success-subtitle">{uploadedFile.originalName}</p>
                            <a
                                href={uploadedFile.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="download-link"
                            >
                                Download File (expires in 1 hour)
                            </a>
                            <p className="file-path">Path: {uploadedFile.path}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="upload-error">
                        <XCircle className="error-icon" size={20} />
                        <div className="error-content">
                            <p className="error-title">Upload failed</p>
                            <p className="error-details">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .file-upload-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
        }

        .upload-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          color: white;
        }

        .upload-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .upload-icon {
          margin: 0 auto 1rem;
          display: block;
          opacity: 0.9;
        }

        .upload-header h2 {
          margin: 0 0 0.5rem;
          font-size: 1.75rem;
          font-weight: 600;
        }

        .upload-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
        }

        .file-input-wrapper {
          margin-bottom: 1.5rem;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .file-input-label:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .file-info {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .file-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .file-name {
          font-weight: 500;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          opacity: 0.8;
          font-size: 0.875rem;
          margin-left: 1rem;
        }

        .upload-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .upload-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-container {
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .progress-text {
          display: block;
          text-align: center;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .upload-success {
          display: flex;
          gap: 1rem;
          background: rgba(16, 185, 129, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: 1rem;
        }

        .success-icon {
          flex-shrink: 0;
          color: #10b981;
        }

        .success-content {
          flex: 1;
        }

        .success-title {
          margin: 0 0 0.25rem;
          font-weight: 600;
        }

        .success-subtitle {
          margin: 0 0 0.75rem;
          opacity: 0.9;
          font-size: 0.875rem;
        }

        .download-link {
          display: inline-block;
          color: white;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          margin-bottom: 0.5rem;
        }

        .download-link:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .file-path {
          margin: 0.5rem 0 0;
          font-size: 0.75rem;
          opacity: 0.7;
          font-family: monospace;
        }

        .upload-error {
          display: flex;
          gap: 1rem;
          background: rgba(239, 68, 68, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 1rem;
        }

        .error-icon {
          flex-shrink: 0;
          color: #ef4444;
        }

        .error-content {
          flex: 1;
        }

        .error-title {
          margin: 0 0 0.25rem;
          font-weight: 600;
        }

        .error-details {
          margin: 0;
          opacity: 0.9;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
}

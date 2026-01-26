import type { UploadProgress, UploadResponse, UploadError } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface UploadOptions {
    userId?: string;
    onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a file to the backend server
 * @param file - The file to upload (must be .doc or .docx)
 * @param options - Upload options including userId and progress callback
 * @returns Promise with upload response containing download URL
 */
export async function uploadFile(
    file: File,
    options: UploadOptions = {}
): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
        // Validate file type on client side
        const allowedExtensions = ['.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            reject({
                error: 'Invalid file type',
                details: 'Only .doc and .docx files are allowed'
            } as UploadError);
            return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            reject({
                error: 'File too large',
                details: 'File size must be less than 10MB'
            } as UploadError);
            return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        if (options.userId) {
            formData.append('userId', options.userId);
        }

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (options.onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress: UploadProgress = {
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100)
                    };
                    options.onProgress?.(progress);
                }
            });
        }

        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response: UploadResponse = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject({
                        error: 'Failed to parse response',
                        details: error instanceof Error ? error.message : 'Unknown error'
                    } as UploadError);
                }
            } else {
                try {
                    const errorResponse: UploadError = JSON.parse(xhr.responseText);
                    reject(errorResponse);
                } catch {
                    reject({
                        error: 'Upload failed',
                        details: `Server returned status ${xhr.status}`
                    } as UploadError);
                }
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            reject({
                error: 'Network error',
                details: 'Failed to connect to server'
            } as UploadError);
        });

        xhr.addEventListener('abort', () => {
            reject({
                error: 'Upload cancelled',
                details: 'Upload was aborted'
            } as UploadError);
        });

        // Send request
        xhr.open('POST', `${BACKEND_URL}/upload`);
        xhr.send(formData);
    });
}

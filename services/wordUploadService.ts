/**
 * Upload Word document (.doc or .docx) to Google Cloud Storage
 * @param file - The Word document file to upload
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with the uploaded file URL and metadata
 */
export async function uploadWordDocument(
    file: File,
    onProgress?: (progress: number) => void
): Promise<{
    success: boolean;
    url: string;
    filename: string;
    originalName: string;
    size: number;
}> {
    // Validate file type
    const validTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['doc', 'docx'].includes(ext)) {
        throw new Error('Only .doc and .docx files are supported');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });
        }

        // Handle successful upload
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Failed to parse server response'));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error || 'Upload failed'));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        // Send request
        xhr.open('POST', 'http://localhost:3001/upload-word');
        xhr.send(formData);
    });
}

/**
 * Get file icon based on file extension
 */
export function getWordDocumentIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'docx' ? '📄' : '📃';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

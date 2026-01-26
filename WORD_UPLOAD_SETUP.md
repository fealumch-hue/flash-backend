# Word Document Upload System - Google Cloud Storage

This system allows users to upload Word documents (.doc and .docx) to Google Cloud Storage from the Pulse AI interface.

## Features

- ✅ Upload .doc and .docx files to Google Cloud Storage
- ✅ 10MB file size limit
- ✅ Real-time upload progress tracking
- ✅ Random filename generation for security
- ✅ Public URL generation for uploaded files
- ✅ Beautiful UI with progress indicators
- ✅ Integration with Pulse AI chat

## Setup Instructions

### 1. Google Cloud Storage Setup

#### Create a GCS Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Storage API
4. Navigate to **Cloud Storage > Buckets**
5. Click **CREATE BUCKET**
6. Choose a unique bucket name (e.g., `flash-pulse-documents`)
7. Select a location (e.g., `us-central1`)
8. Choose **Standard** storage class
9. For access control, select **Uniform**
10. Click **CREATE**

#### Create a Service Account

1. Navigate to **IAM & Admin > Service Accounts**
2. Click **CREATE SERVICE ACCOUNT**
3. Enter a name (e.g., `flash-upload-service`)
4. Click **CREATE AND CONTINUE**
5. Grant the role: **Storage Object Admin**
6. Click **CONTINUE** then **DONE**

#### Download Service Account Key

1. Click on the service account you just created
2. Go to the **KEYS** tab
3. Click **ADD KEY > Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. Save the downloaded JSON file to the backend folder as `service-account-key.json`

### 2. Backend Configuration

#### Update Environment Variables

Edit `/backend/.env` and add:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=flash-pulse-documents
GCS_KEY_FILE_PATH=./service-account-key.json

# Server Configuration
PORT=3001
NODE_ENV=development
```

Replace `your-project-id` with your actual Google Cloud project ID (found in the service account JSON file).

#### Install Dependencies

```bash
cd backend
npm install
```

#### Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 3. Frontend Configuration

The frontend is already configured! No additional setup needed.

## Usage

### Uploading Word Documents in Pulse

1. Navigate to the **Pulse** tab in your Flash application
2. Click the **paperclip icon** (attachment button)
3. Select **Image / PDF / DOC**
4. Choose a .doc or .docx file (max 10MB)
5. Watch the upload progress bar
6. Once uploaded, you'll see a green preview with the filename
7. Type your message (optional) and click **Send**
8. The Word document URL will be included in your message

### File Visibility

By default, uploaded files are made **publicly accessible** via a direct URL. The URL format is:

```
https://storage.googleapis.com/YOUR-BUCKET-NAME/RANDOM-FILENAME.docx
```

If you want to make files **private**, edit `/backend/routes/upload-gcs.js` and remove this line:

```javascript
await blob.makePublic();
```

Then update the URL generation to use signed URLs instead.

## API Endpoints

### POST /upload-word

Uploads a Word document to Google Cloud Storage.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `file` field

**Response:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket-name/abc123.docx",
  "filename": "abc123.docx",
  "originalName": "my-document.docx",
  "size": 245760
}
```

**Error Response:**
```json
{
  "error": "Only .doc and .docx files are allowed"
}
```

### GET /upload-word/health

Health check for the upload service.

**Response:**
```json
{
  "status": "ok",
  "message": "Upload service ready",
  "bucket": "flash-pulse-documents"
}
```

## Security Considerations

### Current Implementation
- ✅ File type validation (.doc and .docx only)
- ✅ File size limit (10MB)
- ✅ Random filename generation (prevents file overwrites)
- ✅ CORS configuration (only localhost:3000)
- ⚠️ Files are publicly accessible

### Recommended for Production

1. **Add Authentication**: Require user authentication before uploads
2. **Rate Limiting**: Limit uploads per user/IP
3. **Virus Scanning**: Integrate with Cloud Security Scanner
4. **Private Files**: Use signed URLs instead of public URLs
5. **User Quotas**: Set storage limits per user
6. **Content Scanning**: Scan uploaded content for malicious files

## Troubleshooting

### Error: "Upload failed"
- Check that the backend server is running on port 3001
- Verify the service account key file exists  
- Ensure the bucket name is correct in .env

### Error: "Authentication Failed"
- Verify the service account JSON file is valid
- Check that the service account has "Storage Object Admin" role
- Ensure the project ID is correct

### Error: "Bucket not found"
- Verify the bucket exists in Google Cloud Console
- Check the bucket name matches exactly (case-sensitive)

### Files upload but URL doesn't work
- Check bucket permissions (should allow public access if using public URLs)
- Verify the bucket's CORS configuration if accessing from web

## Cost Estimation

Google Cloud Storage pricing (as of 2024):
- **Storage**: ~$0.020 per GB/month (Standard class)
- **Operations**: 
  - Write: $0.05 per 10,000 operations
  - Read: $0.004 per 10,000 operations
- **Network**: $0.12 per GB (egress to internet)

For 100 uploads/day (average 5MB each):
- Storage: ~15GB = $0.30/month
- Operations: 3,000 writes = $0.015/month
- Network: 15GB downloads = $1.80/month
- **Total**: ~$2.12/month

## Files

- `/backend/routes/upload-gcs.js` - GCS upload route
- `/backend/server.js` - Express server with GCS route
- `/services/wordUploadService.ts` - Frontend upload service
- `/components/Dashboard.tsx` - UI integration  
- `/backend/.env` - Environment configuration

## Next Steps

- [ ] Add user authentication
- [ ] Implement file deletion
- [ ] Add file management UI
- [ ] Set up Cloud Functions for document processing
- [ ] Add support for other document formats
- [ ] Implement signed URLs for private files

## Support

For issues or questions, please check:
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Node.js Client Library](https://googleapis.dev/nodejs/storage/latest/)

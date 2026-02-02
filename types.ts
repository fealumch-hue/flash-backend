export type Priority = 'low' | 'medium' | 'high';
export type PulseMode = 'general' | 'lens' | 'framework' | 'interpret' | 'saqr';
export type UserClass = '10A' | '10B' | '10C' | '10D';
export type Tab = 'assignments' | 'history' | 'pulse' | 'grades' | 'leaderboard' | 'integrations' | 'settings' | 'simulator';

export interface Attachment {
  name: string;
  type: 'file' | 'drive' | 'image';
  url?: string;
  driveId?: string;
  extractedText?: string;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  weight?: number; // Percentage impact on final grade (0-100)
  notes?: string;
  completedAt?: number;
  isCompleted?: boolean;
  attachments?: string[]; // Legacy support for plain names
  richAttachments?: Attachment[]; // New detailed support
  has_attachment?: boolean; // Backend indicates if assignment has a file
  attachmentUrl?: string; // Public URL to the mirrored file in Google Cloud Storage
}

export interface UserProfile {
  uid: string;
  displayName: string;
  xp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: string[]; // base64 images
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

// File Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  expiresIn: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file: UploadedFile;
}

export interface UploadError {
  error: string;
  details?: string;
}
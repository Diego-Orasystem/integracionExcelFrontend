export interface RemoteMetadata {
  prefix: string | null;
  groupName: string | null;
  serieName: string | null;
  branchCode: string | null;
  requiresBranchCode: boolean;
  companyDirectory: string | null;
  remoteDirectory: string | null;
  remoteFilename: string | null;
}

export interface File {
  _id: string;
  name: string;
  originalName: string;
  description?: string;
  folderId: string;
  companyId: string;
  size: number;
  mimeType: string;
  extension: string;
  storageLocation: string;
  uploadedBy: string;
  uploadType: 'manual' | 'sftp' | 'api';
  version: number;
  status?: 'pendiente' | 'procesando' | 'procesado' | 'error';
  processingDetails?: {
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    errorMessage?: string;
    processingNotes?: string;
  };
  metadata?: {
    sheets: string[];
    rowCount: number;
    columnCount: number;
  };
  remoteMetadata?: RemoteMetadata | null;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileVersion {
  _id: string;
  fileId: string;
  version: number;
  name: string;
  size: number;
  storageLocation: string;
  uploadedBy: string;
  createdAt?: Date;
}

export interface FileUploadResponse {
  success: boolean;
  data: File;
}

export interface FileResponse {
  success: boolean;
  data: File;
}

export interface FilesResponse {
  success: boolean;
  data: File[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

export interface FileVersionsResponse {
  success: boolean;
  data: FileVersion[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
} 
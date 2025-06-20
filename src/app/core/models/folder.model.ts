export interface Folder {
  _id: string;
  name: string;
  parentId?: string | null;
  path: string;
  companyId: string | { _id: string; name: string; };
  createdBy?: string | { _id: string; name: string; email: string; };
  areaId?: string;
  areaName?: string;
  responsibleUserId?: string | { _id: string; name: string; };
  responsibleUserName?: string;
  defaultFileName?: string;
  isDefaultFileRequired?: boolean;
  associatedArea?: {
    _id: string;
    name: string;
    defaultFileName?: string;
    isDefaultFileRequired?: boolean;
    isSubArea?: boolean;
  };
  permissions?: {
    userId: string;
    access: 'read' | 'write' | 'admin';
  }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  itemCount?: number; // Campo calculado para UI
  fileCount?: number;
  subfolderCount?: number;
  isFolder?: boolean;
}

export interface FolderResponse {
  success: boolean;
  data: Folder;
  message?: string;
}

export interface FoldersResponse {
  success: boolean;
  data: Folder[];
  count?: number;
  message?: string;
}

export interface FolderContentResponse {
  success: boolean;
  data: {
    folders?: Folder[];
    files?: any[];
  } | any[];
  count?: number;
  message?: string;
} 
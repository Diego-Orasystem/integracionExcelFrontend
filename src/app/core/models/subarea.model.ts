export interface Subarea {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  areaId: string;
  responsibleUserId?: string;
  expectedFiles?: number;
  defaultFileName?: string;
  isDefaultFileRequired?: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  sampleFiles?: SampleFile[];
  
  // Propiedades para la UI
  responsibleUserName?: string;
  areaName?: string;
  fileCount?: number;
}

export interface SampleFile {
  _id: string;
  fileId: string;
  name: string;
  description?: string;
  size?: number;
  updatedAt?: Date;
} 
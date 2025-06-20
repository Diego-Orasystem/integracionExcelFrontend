export interface Area {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  companyId: string;
  responsibleUserId?: string;
  expectedFiles?: number;
  defaultFileName?: string;
  isDefaultFileRequired?: boolean;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Propiedades para la UI
  responsibleUserName?: string;
  companyName?: string;
  subareaCount?: number;
} 
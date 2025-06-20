export interface Log {
  _id: string;
  userId: string | {
    _id: string;
    name: string;
    email: string;
  };
  companyId: string | {
    _id: string;
    name: string;
  };
  action: string;
  entityType: 'file' | 'folder' | 'user' | 'company' | string;
  entityId: string;
  details?: {
    oldValue?: any;
    newValue?: any;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };
  createdAt: Date;
  
  // Campos poblados (deprecados, mantener por compatibilidad)
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  company?: {
    _id: string;
    name: string;
  };
}

export interface LogResponse {
  success: boolean;
  data: Log;
}

export interface LogsResponse {
  success: boolean;
  data: Log[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

export interface LogSearchParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  term?: string;
  page?: number;
  limit?: number;
} 
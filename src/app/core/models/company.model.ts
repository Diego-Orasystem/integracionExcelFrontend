export interface Company {
  _id: string;
  id?: string;
  name: string;
  emailDomain: string;
  description?: string;
  logo?: string;
  sftp?: {
    host: string;
    port: number;
    username: string;
    password?: string;
    rootDirectory: string;
    enabled: boolean;
  };
  settings?: {
    maxStorage: number;
    allowedFileTypes: string[];
    autoSyncInterval: number;
  };
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyResponse {
  success: boolean;
  data: Company;
}

export interface CompaniesResponse {
  success: boolean;
  data: Company[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

export interface CompanyStats {
  userStats: {
    total: number;
    active: number;
  };
  storageStats: {
    totalFiles: number;
    totalSize: number;
    totalFolders: number;
    usedPercentage: number;
  };
  recentActivity: any[];
}

export interface CompanyStatsResponse {
  success: boolean;
  data: CompanyStats;
} 
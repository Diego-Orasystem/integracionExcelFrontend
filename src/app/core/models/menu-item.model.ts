export interface MenuItem {
  _id: string;
  name: string;
  url?: string;
  icon?: string;
  permissionCode: string;
  order?: number;
  parent?: string | null;
  children?: MenuItem[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
} 
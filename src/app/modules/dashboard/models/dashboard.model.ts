export interface DashboardStats {
  companies: number;
  users: number;
  files: number;
  processedToday: number;
  currentMonth: number;
  dailyAverage: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface DashboardSummaryCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  unit?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface RecentFile {
  id: string;
  name: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'processed' | 'error' | 'pending';
} 
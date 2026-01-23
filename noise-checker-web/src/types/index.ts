// 型定義ファイル

// 物件
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  prefecture: string;
  postalCode: string;
  totalUnits: number;
  constructionYear: number;
  buildingType: 'apartment' | 'mansion' | 'house';
  status: 'active' | 'inactive';
  alertCount: number;
  unrespondedCount: number;
  createdAt: string;
  updatedAt: string;
}

// 部屋
export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  moveInDate?: string;
  status: 'occupied' | 'vacant';
}

// 測定データ
export interface Measurement {
  id: string;
  propertyId: string;
  roomId: string;
  audioFileUrl: string;
  audioFileName: string;
  audioFileSize: number;
  audioDuration: number;
  averageDb: number;
  maxDb: number;
  minDb: number;
  noiseLevel: 'quiet' | 'moderate' | 'noisy' | 'severe';
  isNoiseDetected: boolean;
  standardDay: number;
  standardNight: number;
  timeOfDay: 'day' | 'night';
  exceedsStandard: boolean;
  soundSource?: string;
  soundSourceConfidence?: number;
  notes?: string;
  reporterName?: string;
  reporterContact?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  assignedTo?: string;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
}

// ユーザー
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  companyName: string;
  phone?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

// 統計データ
export interface Statistics {
  totalProperties: number;
  totalMeasurements: number;
  alertCount: number;
  unresolvedCount: number;
  averageDb: number;
  monthlyTrend: TrendData[];
  propertyRanking: PropertyRanking[];
  timeDistribution: TimeDistribution[];
  noiseLevelDistribution: NoiseLevelDistribution;
}

export interface TrendData {
  date: string;
  measurementCount: number;
  averageDb: number;
  alertCount: number;
}

export interface PropertyRanking {
  propertyId: string;
  propertyName: string;
  measurementCount: number;
  averageDb: number;
  alertCount: number;
}

export interface TimeDistribution {
  hour: number;
  count: number;
  averageDb: number;
}

export interface NoiseLevelDistribution {
  quiet: number;
  moderate: number;
  noisy: number;
  severe: number;
}

// フィルター
export interface MeasurementFilter {
  propertyId?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
  minDb?: number;
  maxDb?: number;
  noiseLevel?: string[];
  status?: string[];
  searchText?: string;
}

// ページネーション
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// API レスポンス
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
  message?: string;
}

// アップロードファイル
export interface UploadFile {
  file: File;
  propertyId: string;
  roomId: string;
  reporterName?: string;
  reporterContact?: string;
  notes?: string;
  measuredAt: string;
}

// チャートデータ
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

// 設定
export interface AppSettings {
  companyName: string;
  companyLogo?: string;
  theme: 'light' | 'dark';
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    alertThreshold: number;
  };
}

// ダッシュボード統計カード
export interface DashboardCard {
  title: string;
  value: number | string;
  unit?: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

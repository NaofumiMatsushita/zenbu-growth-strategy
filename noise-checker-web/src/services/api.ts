import axios, { AxiosInstance } from 'axios';
import type {
  Property,
  Measurement,
  User,
  Statistics,
  ApiResponse,
  PaginatedResponse,
  MeasurementFilter,
  UploadFile,
} from '../types';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Axios インスタンス
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// リクエストインターセプター（認証トークン追加）
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラー - ログイン画面にリダイレクト
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========================
// 物件管理 API
// ========================
export const propertyService = {
  // 物件一覧取得
  getAll: async (): Promise<Property[]> => {
    const response = await api.get<ApiResponse<Property[]>>('/properties');
    return response.data.data || [];
  },

  // 物件詳細取得
  getById: async (id: string): Promise<Property> => {
    const response = await api.get<ApiResponse<Property>>(`/properties/${id}`);
    if (!response.data.data) {
      throw new Error('Property not found');
    }
    return response.data.data;
  },

  // 物件登録
  create: async (data: Partial<Property>): Promise<Property> => {
    const response = await api.post<ApiResponse<Property>>('/properties', data);
    if (!response.data.data) {
      throw new Error('Failed to create property');
    }
    return response.data.data;
  },

  // 物件更新
  update: async (id: string, data: Partial<Property>): Promise<Property> => {
    const response = await api.put<ApiResponse<Property>>(`/properties/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update property');
    }
    return response.data.data;
  },

  // 物件削除
  delete: async (id: string): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },

  // 物件統計取得
  getStats: async (id: string): Promise<Statistics> => {
    const response = await api.get<ApiResponse<Statistics>>(`/properties/${id}/stats`);
    if (!response.data.data) {
      throw new Error('Failed to get property stats');
    }
    return response.data.data;
  },
};

// ========================
// 測定データ管理 API
// ========================
export const measurementService = {
  // 測定データ一覧取得（フィルタ・ページネーション対応）
  getAll: async (
    filter?: MeasurementFilter,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Measurement>> => {
    const response = await api.get<PaginatedResponse<Measurement>>('/measurements', {
      params: { ...filter, page, pageSize },
    });
    return response.data;
  },

  // 測定データ詳細取得
  getById: async (id: string): Promise<Measurement> => {
    const response = await api.get<ApiResponse<Measurement>>(`/measurements/${id}`);
    if (!response.data.data) {
      throw new Error('Measurement not found');
    }
    return response.data.data;
  },

  // 音声ファイルアップロード・分析
  upload: async (uploadData: UploadFile): Promise<Measurement> => {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('propertyId', uploadData.propertyId);
    formData.append('roomId', uploadData.roomId);
    formData.append('measuredAt', uploadData.measuredAt);

    if (uploadData.reporterName) {
      formData.append('reporterName', uploadData.reporterName);
    }
    if (uploadData.reporterContact) {
      formData.append('reporterContact', uploadData.reporterContact);
    }
    if (uploadData.notes) {
      formData.append('notes', uploadData.notes);
    }

    const response = await api.post<ApiResponse<Measurement>>(
      '/measurements/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2分（音声分析に時間がかかる場合があるため）
      }
    );

    if (!response.data.data) {
      throw new Error('Failed to upload and analyze audio file');
    }
    return response.data.data;
  },

  // 測定データ更新
  update: async (id: string, data: Partial<Measurement>): Promise<Measurement> => {
    const response = await api.put<ApiResponse<Measurement>>(`/measurements/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update measurement');
    }
    return response.data.data;
  },

  // 測定データ削除
  delete: async (id: string): Promise<void> => {
    await api.delete(`/measurements/${id}`);
  },

  // 一括削除
  bulkDelete: async (ids: string[]): Promise<void> => {
    await api.post('/measurements/bulk-delete', { ids });
  },

  // ステータス更新
  updateStatus: async (
    id: string,
    status: Measurement['status'],
    assignedTo?: string
  ): Promise<Measurement> => {
    const response = await api.patch<ApiResponse<Measurement>>(`/measurements/${id}/status`, {
      status,
      assignedTo,
    });
    if (!response.data.data) {
      throw new Error('Failed to update status');
    }
    return response.data.data;
  },

  // CSVエクスポート
  exportCsv: async (filter?: MeasurementFilter): Promise<Blob> => {
    const response = await api.get('/measurements/export/csv', {
      params: filter,
      responseType: 'blob',
    });
    return response.data;
  },

  // Excelエクスポート
  exportExcel: async (filter?: MeasurementFilter): Promise<Blob> => {
    const response = await api.get('/measurements/export/excel', {
      params: filter,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ========================
// 統計・分析 API
// ========================
export const statisticsService = {
  // ダッシュボード統計取得
  getDashboard: async (): Promise<Statistics> => {
    const response = await api.get<ApiResponse<Statistics>>('/statistics/dashboard');
    if (!response.data.data) {
      throw new Error('Failed to get dashboard statistics');
    }
    return response.data.data;
  },

  // 月次トレンド取得
  getMonthlyTrend: async (months: number = 6): Promise<Statistics['monthlyTrend']> => {
    const response = await api.get<ApiResponse<Statistics['monthlyTrend']>>(
      '/statistics/monthly-trend',
      { params: { months } }
    );
    return response.data.data || [];
  },

  // 物件別ランキング取得
  getPropertyRanking: async (limit: number = 10): Promise<Statistics['propertyRanking']> => {
    const response = await api.get<ApiResponse<Statistics['propertyRanking']>>(
      '/statistics/property-ranking',
      { params: { limit } }
    );
    return response.data.data || [];
  },

  // 時間帯別分布取得
  getTimeDistribution: async (): Promise<Statistics['timeDistribution']> => {
    const response = await api.get<ApiResponse<Statistics['timeDistribution']>>(
      '/statistics/time-distribution'
    );
    return response.data.data || [];
  },
};

// ========================
// ユーザー管理 API
// ========================
export const userService = {
  // 現在のユーザー情報取得
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/me');
    if (!response.data.data) {
      throw new Error('Failed to get current user');
    }
    return response.data.data;
  },

  // ユーザー一覧取得
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data || [];
  },

  // ユーザー登録
  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    if (!response.data.data) {
      throw new Error('Failed to create user');
    }
    return response.data.data;
  },

  // ユーザー更新
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update user');
    }
    return response.data.data;
  },

  // ユーザー削除
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// ========================
// 認証 API
// ========================
export const authService = {
  // ログイン
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });
    if (!response.data.data) {
      throw new Error('Login failed');
    }
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    return { token, user };
  },

  // ログアウト
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
  },

  // パスワードリセット
  resetPassword: async (email: string): Promise<void> => {
    await api.post('/auth/reset-password', { email });
  },

  // トークン更新
  refreshToken: async (): Promise<string> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
    if (!response.data.data) {
      throw new Error('Failed to refresh token');
    }
    const { token } = response.data.data;
    localStorage.setItem('authToken', token);
    return token;
  },
};

export default api;

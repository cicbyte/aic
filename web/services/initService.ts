// 初始化相关 API
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  // 初始化接口不需要认证
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.code !== 0) throw new Error(json.message || '请求失败');
  return json.data;
}

export interface InitStatusResponse {
  initialized: boolean;
}

export interface InitTestRequest {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface InitTestResponse {
  success: boolean;
  version?: string;
  error?: string;
}

export interface InitSetupRequest extends InitTestRequest {
  database: string;
}

export interface InitSetupResponse {
  success: boolean;
  error?: string;
}

export const initApi = {
  // 检查初始化状态
  status: () => request<InitStatusResponse>('/init/status'),

  // 测试数据库连接
  testConnection: (data: InitTestRequest) =>
    request<InitTestResponse>('/init/test-connection', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 执行系统初始化
  setup: (data: InitSetupRequest) =>
    request<InitSetupResponse>('/init/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

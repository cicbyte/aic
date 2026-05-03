import type { ApiError } from './types';

// 请求拦截器配置
interface RequestConfig {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

// 响应拦截器错误类型
interface ResponseError extends Error {
  response?: {
    status: number;
    data: {
      code: number;
      message: string;
    };
  };
}

// 创建增强的 fetch 函数
function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    // 添加 token 到请求头
    const token = localStorage.getItem('token');
    const config: RequestConfig = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config as RequestInit);
      return response;
    } catch (error) {
      const err = error as Error;
      throw new Error(`网络错误: ${err.message}`);
    }
  };
}

// 创建响应处理函数
function createResponseHandler() {
  return async <T>(response: Promise<Response> | Response): Promise<T> => {
    const res = await response;

    // 处理 401 未授权错误
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('认证失败，请重新登录');
    }

    // 解析响应
    const data = await res.json();

    // 检查业务错误码
    if (data.code !== undefined && data.code !== 0) {
      const error = new Error(data.message || '请求失败') as ApiError;
      error.response = {
        status: res.status,
        data,
      };
      throw error;
    }

    return data.data as T;
  };
}

// 导出工具函数
export const authenticatedFetch = createAuthenticatedFetch();
export const handleResponse = createResponseHandler();

// 便捷的请求方法
export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/v1${endpoint}`;
  const response = await authenticatedFetch(url, options);
  return handleResponse<T>(response);
}

// 检查认证状态
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

// 登出
export function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

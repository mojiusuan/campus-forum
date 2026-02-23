/**
 * API 客户端配置
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '../types/api';

// 默认 API 地址：优先使用环境变量，其次根据当前访问域名自动推断
// - 生产环境 VITE_API_URL 留空：使用相对路径 /api（同域部署）
// - 本地开发：http://localhost:5173 -> http://localhost:3000
// - 局域网手机访问：http://192.168.x.x:5173 -> http://192.168.x.x:3000
const DEFAULT_API_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  envApiUrl !== undefined && envApiUrl !== ''
    ? envApiUrl
    : import.meta.env.PROD
      ? ''
      : DEFAULT_API_URL;

// 创建 axios 实例（API_URL 为空时使用相对路径 /api）
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误:', error.message);
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
      });
    }

    // 处理 401 未授权（Token 过期或无效）
    if (error.response.status === 401) {
      const errorData = error.response.data;
      if (errorData?.error?.code === 'TOKEN_EXPIRED' || errorData?.error?.code === 'TOKEN_INVALID') {
        // 清除本地存储的 token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 跳转到登录页
        window.location.href = '/login';
      }
    }

    // 处理 403 禁止访问（账户被封禁）
    if (error.response.status === 403) {
      const errorData = error.response.data;
      if (errorData?.error?.message?.includes('封禁') || errorData?.error?.message?.includes('禁用')) {
        // 清除本地存储的 token 和用户信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 跳转到登录页，并传递封禁信息
        const message = encodeURIComponent(errorData.error.message || '账户已被封禁');
        window.location.href = `/login?error=${message}`;
        return Promise.reject({
          code: 'ACCOUNT_BANNED',
          message: errorData.error.message || '账户已被封禁',
        });
      }
    }

    // 返回统一的错误格式
    const errorResponse = error.response.data;
    return Promise.reject({
      code: errorResponse?.error?.code || 'UNKNOWN_ERROR',
      message: errorResponse?.error?.message || error.message || '请求失败',
      details: errorResponse?.error?.details,
    });
  }
);

export default apiClient;

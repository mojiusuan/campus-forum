/**
 * URL 工具函数
 */

// 默认 API 地址：与 client.ts 逻辑一致
// - 生产环境 VITE_API_URL 留空：使用相对路径（同域部署）
// - 本地开发：根据当前 hostname:3000 推断
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

/**
 * 将相对路径转换为完整URL
 * @param path 相对路径，如 /uploads/images/xxx.jpg
 * @returns 完整URL或相对路径
 */
export function getFullUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return API_URL ? `${API_URL}${path.startsWith('/') ? path : '/' + path}` : (path.startsWith('/') ? path : '/' + path);
}

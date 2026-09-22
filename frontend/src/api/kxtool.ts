/**
 * 空闲教室查询 API（后端 /api/kxtool 代理，多会话：每个用户同步自己的 ehall 登录态）
 *
 * 方案 B：用户自己在官网登录 → 复制浏览器里的 ehall 登录态(Cookie) → 同步到本工具
 * 不由服务器代为登录（不经手密码、不自动过验证码）
 */
import apiClient from './client';

export interface KxRoom {
  name: string;
  free: number[];
  allday: boolean;
}
export interface KxFreeResult {
  week: number;
  day: number;
  count: number;
  rooms: KxRoom[];
}
export interface KxBuilding {
  dm: string;
  name: string;
  campus?: string;
}
export interface KxStatus {
  logged: boolean;
  user?: string | null;
}

export const kxtoolApi = {
  status: () => apiClient.get<KxStatus>('/kxtool/status').then((r) => r.data),
  /** 同步登录态（粘贴的 Cookie 字符串） */
  sync: (cookie: string) =>
    apiClient
      .post<{ ok?: boolean; error?: string }>('/kxtool/session', { cookie })
      .then((r) => r.data),
  logout: () => apiClient.post('/kxtool/logout', {}).then((r) => r.data),
  buildings: () =>
    apiClient.get<{ buildings: KxBuilding[] }>('/kxtool/buildings').then((r) => r.data),
  free: (date: string, building: string, period: 'allday' | 'any') =>
    apiClient
      .get<KxFreeResult>('/kxtool/free', { params: { date, building: building || '', period } })
      .then((r) => r.data),
};

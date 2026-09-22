/**
 * 空闲教室查询 API（后端 /api/kxtool 代理，多会话：每个用户用自己的 ehall 账号）
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
  mfa_pending?: boolean;
  user?: string | null;
}

export const kxtoolApi = {
  status: () => apiClient.get<KxStatus>('/kxtool/status').then((r) => r.data),
  login: (user: string, pass: string) =>
    apiClient
      .post<{ ok?: boolean; need_mfa?: boolean; error?: string; msg?: string }>('/kxtool/login', {
        user,
        pass,
      })
      .then((r) => r.data),
  mfa: (code: string) =>
    apiClient.post<{ ok?: boolean; error?: string }>('/kxtool/mfa', { code }).then((r) => r.data),
  logout: () => apiClient.post('/kxtool/logout', {}).then((r) => r.data),
  buildings: () =>
    apiClient.get<{ buildings: KxBuilding[] }>('/kxtool/buildings').then((r) => r.data),
  free: (date: string, building: string, period: 'allday' | 'any') =>
    apiClient
      .get<KxFreeResult>('/kxtool/free', { params: { date, building: building || '', period } })
      .then((r) => r.data),
};

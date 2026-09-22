/**
 * 空闲教室查询 API（后端 /api/kxtool 代理）
 * 方案 A：在页面里输账号密码 + 用户自己拖滑块 + 企业号验证码
 * （滑块由用户本人完成，非自动识别）
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
export interface KxCaptcha {
  ok: boolean;
  bigImage: string;
  smallImage: string;
  bigWidth: number;
  error?: string;
}
export interface KxTrack {
  a: number;
  b: number;
  c: number;
}

export const kxtoolApi = {
  status: () => apiClient.get<KxStatus>('/kxtool/status').then((r) => r.data),
  captcha: () => apiClient.get<KxCaptcha>('/kxtool/captcha').then((r) => r.data),
  login: (user: string, pass: string, displayWidth: number, tracks: KxTrack[]) =>
    apiClient
      .post<{ ok?: boolean; need_mfa?: boolean; error?: string; msg?: string; captcha?: KxCaptcha }>(
        '/kxtool/login',
        { user, pass, displayWidth, tracks }
      )
      .then((r) => r.data),
  mfa: (code: string) =>
    apiClient.post<{ ok?: boolean; error?: string }>('/kxtool/mfa', { code }).then((r) => r.data),
  sync: (cookie: string) =>
    apiClient.post<{ ok?: boolean; error?: string }>('/kxtool/session', { cookie }).then((r) => r.data),
  logout: () => apiClient.post('/kxtool/logout', {}).then((r) => r.data),
  buildings: () =>
    apiClient.get<{ buildings: KxBuilding[] }>('/kxtool/buildings').then((r) => r.data),
  free: (date: string, building: string, period: 'allday' | 'any') =>
    apiClient
      .get<KxFreeResult>('/kxtool/free', { params: { date, building: building || '', period } })
      .then((r) => r.data),
};

/**
 * 空闲教室查询 API（由后端 /api/kxtool 代理到本机服务）
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

export const kxtoolApi = {
  /** 教学楼列表 */
  buildings: () =>
    apiClient.get<{ buildings: KxBuilding[] }>('/kxtool/buildings').then((r) => r.data),
  /** 某天 / 某楼 / 时段 的空闲教室 */
  free: (date: string, building: string, period: 'allday' | 'any') =>
    apiClient
      .get<KxFreeResult>('/kxtool/free', { params: { date, building: building || '', period } })
      .then((r) => r.data),
};

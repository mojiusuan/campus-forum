import { Router } from 'express';
import { sendError } from '../utils/response.js';

/**
 * 空闲教室查询（代理到本机 kxtool 服务）
 * - kxtool 服务只监听 127.0.0.1:8899，口令由后端保管（KXTOOL_TOKEN）
 * - 前端同源调用 /api/kxtool/*，无需知道口令
 */
const router = Router();

const BASE = process.env.KXTOOL_BASE || 'http://127.0.0.1:8899';
const TOKEN = process.env.KXTOOL_TOKEN || '';

async function proxy(res: any, path: string): Promise<void> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(`${BASE}${path}`, {
      headers: { 'X-Token': TOKEN },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const text = await r.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'UNAVAILABLE', message: '空闲教室服务返回异常' };
    }
    if (r.status === 401) {
      sendError(res, 'KXTOOL_UNAUTHORIZED', '空闲教室服务未登录（请管理员重新登录 ehall）', undefined, 503);
      return;
    }
    res.status(r.status === 200 ? 200 : 503).json(data);
  } catch {
    sendError(res, 'KXTOOL_UNAVAILABLE', '空闲教室服务暂不可用，请稍后再试', undefined, 503);
  }
}

router.get('/status', (req, res) => proxy(res, '/api/status'));
router.get('/buildings', (req, res) => proxy(res, '/api/buildings'));
router.get('/free', (req, res) => {
  const q = new URLSearchParams(req.query as Record<string, string>).toString();
  proxy(res, `/api/free?${q}`);
});

export default router;

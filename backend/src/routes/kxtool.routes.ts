import { Router } from 'express';
import type { Request, Response } from 'express-serve-static-core';
import { sendError } from '../utils/response.js';
import { authenticate } from '../middleware/auth.js';

/**
 * 空闲教室查询（代理到本机 kxtool 服务，多会话版）
 * - 每个登录用户用自己的 ehall 账号登录，会话以 sid = u<userId> 隔离
 * - 口令 KXTOOL_TOKEN 由后端保管，前端不可见
 */
const router = Router();

const BASE = process.env.KXTOOL_BASE || 'http://127.0.0.1:8899';
const TOKEN = process.env['KX' + 'TOOL_TOKEN'] || '';

async function proxy(req: Request, res: Response, path: string): Promise<void> {
  const sid = `u${req.user?.userId || 'anon'}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 40000);
    const isPost = req.method === 'POST';
    const r = await fetch(`${BASE}${path}`, {
      method: req.method,
      headers: Object.assign(
        { 'X-Token': TOKEN, 'X-Sid': sid },
        isPost ? { 'Content-Type': 'application/json' } : {}
      ),
      body: isPost ? JSON.stringify(req.body || {}) : undefined,
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
    // kxtool 未登录 → 前端应显示登录表单
    if (r.status === 401) {
      res.status(200).json({ logged: false, ...(data.error ? { error: data.error } : {}) });
      return;
    }
    res.status(r.status === 200 ? 200 : 502).json(data);
  } catch {
    sendError(res, 'KXTOOL_UNAVAILABLE', '空闲教室服务暂不可用，请稍后再试', undefined, 503);
  }
}

router.use(authenticate);

router.get('/status', (req, res) => proxy(req, res, '/api/status'));
router.get('/buildings', (req, res) => proxy(req, res, '/api/buildings'));
router.get('/free', (req, res) => {
  const q = new URLSearchParams(req.query as Record<string, string>).toString();
  proxy(req, res, `/api/free?${q}`);
});
router.post('/session', (req, res) => proxy(req, res, '/api/session'));
router.post('/logout', (req, res) => proxy(req, res, '/api/logout'));

export default router;

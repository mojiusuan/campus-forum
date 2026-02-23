/**
 * API 接口测试脚本
 * 运行前请确保后端服务已启动: npm run dev
 * 运行: npm run test:api 或 npx tsx scripts/api-test.ts
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const API = `${BASE}/api`;

let token: string | null = null;
let testUserId: string | null = null;
let testPostId: string | null = null;
let categoryId: string | null = null;

const results: { name: string; ok: boolean; message?: string }[] = [];

function log(msg: string) {
  console.log(msg);
}

async function request(
  path: string,
  options: RequestInit & { method?: string; body?: string | object } = {}
): Promise<{ status: number; data: any }> {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const body = options.body !== undefined
    ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    : undefined;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = { raw: await res.text() };
  }
  return { status: res.status, data };
}

function ok(name: string, condition: boolean, message?: string) {
  results.push({ name, ok: condition, message });
  const icon = condition ? 'PASS' : 'FAIL';
  log(`  [${icon}] ${name}${message ? ' - ' + message : ''}`);
}

async function run(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (e: any) {
    ok(name, false, e?.message || String(e));
  }
}

async function main() {
  const unique = `test${Date.now()}`;
  log('\n========== API 接口测试 ==========\n');
  log(`Base URL: ${API}\n`);

  // ----- 健康检查 -----
  await run('GET /api/health', async () => {
    const { status, data } = await request('/health');
    ok('GET /api/health', status === 200 && data?.success === true);
  });

  // ----- 认证：注册 -----
  await run('POST /api/auth/register', async () => {
    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: {
        email: `${unique}@test.com`,
        username: unique,
        password: 'Test123456',
      },
    });
    ok('POST /api/auth/register', status === 200 || status === 201, status === 200 ? '已注册' : String(status));
    if (data?.data?.user?.id) testUserId = data.data.user.id;
    if (data?.data?.token) token = data.data.token;
  });

  // 若注册返回已存在，尝试登录
  if (!token) {
    await run('POST /api/auth/login (fallback)', async () => {
      const { status, data } = await request('/auth/login', {
        method: 'POST',
        body: { email: `${unique}@test.com`, password: 'Test123456' },
      });
      ok('POST /api/auth/login', status === 200 && !!data?.data?.token);
      if (data?.data?.token) token = data.data.token;
      if (data?.data?.user?.id) testUserId = data.data.user.id;
    });
  }

  // ----- 认证：登录错误密码（接口返回 404 或 401）-----
  await run('POST /api/auth/login (wrong password)', async () => {
    const { status, data } = await request('/auth/login', {
      method: 'POST',
      body: { email: `${unique}@test.com`, password: 'WrongPassword' },
    });
    ok('POST /api/auth/login 错误密码', (status === 401 || status === 404) && data?.success === false);
  });

  // ----- 认证：登录正确 -----
  if (!token) {
    await run('POST /api/auth/login', async () => {
      const { status, data } = await request('/auth/login', {
        method: 'POST',
        body: { email: `${unique}@test.com`, password: 'Test123456' },
      });
      ok('POST /api/auth/login', status === 200 && !!data?.data?.token);
      token = data?.data?.token ?? null;
      testUserId = data?.data?.user?.id ?? null;
    });
  }

  // ----- 获取当前用户 -----
  await run('GET /api/auth/me', async () => {
    const { status, data } = await request('/auth/me');
    ok('GET /api/auth/me', status === 200 && data?.success === true && !!data?.data?.id);
  });

  // ----- 分类列表 -----
  await run('GET /api/categories', async () => {
    const { status, data } = await request('/categories');
    ok('GET /api/categories', status === 200 && Array.isArray(data?.data?.categories));
    if (data?.data?.categories?.length) categoryId = data.data.categories[0].id;
  });

  // ----- 分类详情 -----
  await run('GET /api/categories/:id', async () => {
    if (!categoryId) {
      ok('GET /api/categories/:id', true, 'skip (no category)');
      return;
    }
    const { status, data } = await request(`/categories/${categoryId}`);
    ok('GET /api/categories/:id', status === 200 && data?.success === true && data?.data?.id === categoryId);
  });

  // ----- 帖子列表 -----
  await run('GET /api/posts', async () => {
    const { status, data } = await request('/posts');
    ok('GET /api/posts', status === 200 && data?.success === true && 'data' in data);
  });

  // ----- 帖子搜索 (posts/search) -----
  await run('GET /api/posts/search', async () => {
    const { status, data } = await request('/posts/search?keyword=test');
    ok('GET /api/posts/search', status === 200 && data?.success === true);
  });

  // ----- 搜索模块 -----
  await run('GET /api/search/posts', async () => {
    const { status, data } = await request('/search/posts?keyword=hello');
    ok('GET /api/search/posts', status === 200 && data?.success === true);
  });

  await run('GET /api/search', async () => {
    const { status, data } = await request('/search?keyword=test&type=posts');
    ok('GET /api/search', status === 200 && data?.success === true);
  });

  // ----- 需要登录的接口 -----
  await run('GET /api/users/:id', async () => {
    if (!testUserId) {
      ok('GET /api/users/:id', true, 'skip (no user id)');
      return;
    }
    const { status, data } = await request(`/users/${testUserId}`);
    ok('GET /api/users/:id', status === 200 && data?.success === true && (data?.data?.id === testUserId || !!data?.data?.username));
  });

  await run('GET /api/notifications', async () => {
    const { status, data } = await request('/notifications');
    ok('GET /api/notifications', status === 200 && data?.success === true);
  });

  await run('GET /api/notifications/unread-count', async () => {
    const { status, data } = await request('/notifications/unread-count');
    const count = data?.data?.unreadCount ?? data?.data;
    ok('GET /api/notifications/unread-count', status === 200 && typeof count === 'number');
  });

  await run('GET /api/conversations', async () => {
    const { status, data } = await request('/conversations');
    ok('GET /api/conversations', status === 200 && data?.success === true);
  });

  await run('GET /api/messages/unread-count', async () => {
    const { status, data } = await request('/messages/unread-count');
    const count = data?.data?.unreadCount ?? data?.data;
    ok('GET /api/messages/unread-count', status === 200 && typeof count === 'number');
  });

  await run('GET /api/resources', async () => {
    const { status, data } = await request('/resources');
    ok('GET /api/resources', status === 200 && data?.success === true && Array.isArray(data?.data?.resources));
  });

  // ----- 创建帖子 -----
  await run('POST /api/posts', async () => {
    if (!categoryId) {
      ok('POST /api/posts', true, 'skip (no category)');
      return;
    }
    const { status, data } = await request('/posts', {
      method: 'POST',
      body: {
        title: 'API测试帖子',
        content: '这是一条由API测试脚本创建的帖子。',
        categoryId,
      },
    });
    ok('POST /api/posts', status === 200 || status === 201);
    if (data?.data?.id) testPostId = data.data.id;
  });

  // ----- 帖子详情 -----
  await run('GET /api/posts/:id', async () => {
    if (!testPostId) {
      ok('GET /api/posts/:id', true, 'skip (no post id)');
      return;
    }
    const { status, data } = await request(`/posts/${testPostId}`);
    ok('GET /api/posts/:id', status === 200 && data?.success === true && data?.data?.id === testPostId);
  });

  // ----- 评论列表（无评论也应为 200）-----
  if (testPostId) {
    await run('GET /api/posts/:postId/comments', async () => {
      const { status, data } = await request(`/posts/${testPostId}/comments`);
      ok('GET /api/posts/:postId/comments', status === 200 && data?.success === true);
    });
  }

  // ----- 未登录访问受保护接口应 401 -----
  const savedToken = token;
  token = null;
  await run('GET /api/auth/me (no token -> 401)', async () => {
    const { status, data } = await request('/auth/me');
    ok('GET /api/auth/me 无Token', status === 401 && data?.success === false);
  });
  token = savedToken;

  // ----- 不存在的资源 404 -----
  await run('GET /api/categories/:id (404)', async () => {
    const { status } = await request('/categories/00000000-0000-0000-0000-000000000000');
    ok('GET /api/categories 不存在', status === 404);
  });

  // ----- 登出 -----
  await run('POST /api/auth/logout', async () => {
    const { status } = await request('/auth/logout', { method: 'POST' });
    ok('POST /api/auth/logout', status === 200);
  });

  // ----- 汇总 -----
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  log('\n========== 测试结果 ==========');
  log(`通过: ${passed}/${results.length}`);
  if (failed.length) {
    log('失败:');
    failed.forEach((f) => log(`  - ${f.name}${f.message ? ': ' + f.message : ''}`));
    process.exit(1);
  }
  log('全部通过。\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

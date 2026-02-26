import prisma from './db.js';

const ANONYMOUS_USERNAME = '匿名';

/** 匿名板块展示用：替换后的用户信息 */
export const MASKED_USER = {
  username: '匿名',
  avatarUrl: null as string | null,
};

let cachedAnonymousUserId: string | null = null;

/**
 * 获取匿名系统用户 ID（用于情感树洞等匿名发帖/评论）
 */
export async function getAnonymousUserId(): Promise<string | null> {
  if (cachedAnonymousUserId) return cachedAnonymousUserId;
  const user = await prisma.user.findUnique({
    where: { username: ANONYMOUS_USERNAME },
    select: { id: true },
  });
  if (user) cachedAnonymousUserId = user.id;
  return cachedAnonymousUserId;
}

/**
 * 若分类为匿名板块，返回需展示的“用户”信息（匿名）；否则返回原 user
 */
export function maskUserForAnonymous<T extends { username?: string; avatarUrl?: string | null }>(
  user: T | null | undefined,
  categoryIsAnonymous: boolean
): T | { username: string; avatarUrl: null } | null | undefined {
  if (!user) return user;
  if (categoryIsAnonymous)
    return { ...user, username: MASKED_USER.username, avatarUrl: MASKED_USER.avatarUrl };
  return user;
}

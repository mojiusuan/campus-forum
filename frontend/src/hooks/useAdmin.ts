import { useAuthStore } from '../store/authStore';

/**
 * 检查当前用户是否是管理员
 */
export function useIsAdmin(): boolean {
  const { user } = useAuthStore();
  return user?.role === 'admin' || user?.role === 'super_admin' || user?.isAdmin === true;
}

/**
 * 检查当前用户是否是超级管理员
 */
export function useIsSuperAdmin(): boolean {
  const { user } = useAuthStore();
  return user?.role === 'super_admin';
}

/**
 * 要求管理员权限
 * 如果不是管理员，抛出错误
 */
export function useRequireAdmin(): boolean {
  const isAdmin = useIsAdmin();
  
  if (!isAdmin) {
    throw new Error('需要管理员权限');
  }
  
  return true;
}

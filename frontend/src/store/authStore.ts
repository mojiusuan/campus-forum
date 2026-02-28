/**
 * 用户认证状态管理（Zustand）
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    phone?: string,
    studentIdImageUrl?: string
  ) => Promise<{ pending?: boolean; message?: string } | void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            const { user, token } = response.data;
            // 立即写入 localStorage，确保 API 客户端能读取到
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('登录失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (
        email: string,
        username: string,
        password: string,
        phone?: string,
        studentIdImageUrl?: string
      ) => {
        set({ isLoading: true });
        try {
          if (!studentIdImageUrl) {
            throw new Error('请上传学生证照片');
          }
          const response = await authApi.register({
            email,
            username,
            password,
            phone,
            studentIdImageUrl,
          });
          if (response.success && response.data) {
            const data = response.data as { user?: User; token?: string; message?: string; pending?: boolean };
            if (data.pending) {
              set({ isLoading: false });
              return { pending: true, message: data.message }; // 待审核，由页面展示提示
            }
            if (data.user && data.token) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              set({
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              throw new Error('注册失败');
            }
          } else {
            throw new Error('注册失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('登出失败:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      fetchUser: async () => {
        // 优先从 localStorage 读取 token（因为 API 客户端也用它）
        const tokenFromStorage = localStorage.getItem('token');
        const { token } = get();
        const finalToken = tokenFromStorage || token;
        
        if (!finalToken) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        // 如果 store 中的 token 和 localStorage 不一致，同步一下
        if (token !== finalToken) {
          set({ token: finalToken });
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          if (response.success && response.data) {
            const user = response.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token: finalToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('获取用户信息失败');
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // 确保状态同步
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // 如果有 token，确保 isAuthenticated 为 true
          state.isAuthenticated = true;
        }
      },
    }
  )
);

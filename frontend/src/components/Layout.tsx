/**
 * 主布局组件
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { notificationsApi } from '../api/notifications';
import { messagesApi } from '../api/messages';
import { getFullUrl } from '../utils/url';
import { LogOut, User, Home, Search, PlusCircle, Bell, MessageSquare, FileText, X, Shield, Sparkles } from 'lucide-react';
import { useIsAdmin } from '../hooks/useAdmin';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isAuthenticated, logout, token } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 检查是否有 token（包括 localStorage 中的）
  const hasToken = isAuthenticated || !!token || !!localStorage.getItem('token');

  // 获取未读通知数
  const { data: unreadNotifications } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.data?.unreadCount || 0;
    },
    enabled: hasToken,
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 获取未读消息数
  const { data: unreadMessages } = useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: async () => {
      const response = await messagesApi.getUnreadCount();
      return response.data?.unreadCount || 0;
    },
    enabled: hasToken,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/forum" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900">校园论坛</span>
            </Link>

            {/* Navigation - 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100"
              >
                <Sparkles className="inline-block w-4 h-4 mr-1" />
                展示页
              </Link>
              <Link
                to="/forum"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/forum'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="inline-block w-4 h-4 mr-1" />
                首页
              </Link>
              <Link
                to="/search"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Search className="inline-block w-4 h-4 mr-1" />
                搜索
              </Link>
              <Link
                to="/resources"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/resources'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="inline-block w-4 h-4 mr-1" />
                资料
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/posts/new"
                    className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    发帖
                  </Link>
                  <Link
                    to="/messages"
                    className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="私信"
                  >
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    {unreadMessages && unreadMessages > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/notifications"
                    className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="通知"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadNotifications && unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                      title="管理面板"
                    >
                      <Shield className="w-5 h-5 text-purple-600" />
                    </Link>
                  )}
                  <Link
                    to={`/users/${user?.id}`}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {user?.avatarUrl && getFullUrl(user.avatarUrl) ? (
                      <img
                        src={getFullUrl(user.avatarUrl)!}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          // 图片加载失败时隐藏，显示默认头像
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    {(!user?.avatarUrl || !getFullUrl(user.avatarUrl)) && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user?.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="登出"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Sparkles className="inline-block w-4 h-4 mr-2" />
              展示页
            </Link>
            <Link
              to="/forum"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/forum'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="inline-block w-4 h-4 mr-2" />
              首页
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/search'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Search className="inline-block w-4 h-4 mr-2" />
              搜索
            </Link>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/resources'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              资料
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/posts/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <PlusCircle className="inline-block w-4 h-4 mr-2" />
                  发帖
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="inline-block w-4 h-4 mr-2" />
                  通知
                  {unreadNotifications && unreadNotifications > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative"
                >
                  <MessageSquare className="inline-block w-4 h-4 mr-2" />
                  消息
                  {unreadMessages && unreadMessages > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  to={`/users/${user?.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="inline-block w-4 h-4 mr-2" />
                  我的资料
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <Shield className="inline-block w-4 h-4 mr-2" />
                    管理面板
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="inline-block w-4 h-4 mr-2" />
                  退出登录
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 校园论坛. All rights reserved.</p>
            <p className="mt-2">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 underline"
              >
                陕ICP备2026003916号
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

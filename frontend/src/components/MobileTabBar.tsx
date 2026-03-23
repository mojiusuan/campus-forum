/**
 * 手机端底部 TabBar（类 App 体验）
 * 仅在特定主要页面展示，并避免和帖子详情的固定操作栏重叠。
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, FileText, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const tabs = [
  { key: 'home', label: '首页', path: '/forum', icon: Home },
  { key: 'search', label: '搜索', path: '/search', icon: Search },
  { key: 'resources', label: '资料', path: '/resources', icon: FileText },
  { key: 'me', label: '我的', path: 'me', icon: User },
];

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const pathname = location.pathname;

  // 只在主要页面展示；帖子详情会有自己的固定操作栏
  const showOnPrefixes = ['/forum', '/search', '/resources', '/users/'];
  const shouldShow = showOnPrefixes.some((p) => pathname.startsWith(p));
  if (!shouldShow) return null;

  const handleNavigate = (path: string) => {
    if (path === 'me') {
      if (isAuthenticated && user?.id) {
        navigate(`/users/${user.id}`);
      } else {
        navigate('/login');
      }
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <div className="max-w-4xl mx-auto flex justify-around px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            (tab.key !== 'me' && pathname.startsWith(tab.path)) ||
            (tab.key === 'me' && pathname.startsWith('/users/'));

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleNavigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span
                className={`mt-0.5 text-[11px] leading-none ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


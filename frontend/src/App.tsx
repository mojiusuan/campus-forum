/**
 * 应用主入口
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { ListSkeleton } from './components/LoadingSkeleton';

// 立即加载的页面（关键路径）
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// 懒加载的页面
const PostDetail = lazy(() => import('./pages/PostDetail'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const EditPost = lazy(() => import('./pages/EditPost'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Search = lazy(() => import('./pages/Search'));
const Messages = lazy(() => import('./pages/Messages'));
const Conversation = lazy(() => import('./pages/Conversation'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Resources = lazy(() => import('./pages/Resources'));
const UploadResource = lazy(() => import('./pages/UploadResource'));

// 管理员页面（懒加载）
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'));
const AdminComments = lazy(() => import('./pages/admin/AdminComments'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));

// 加载中组件
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { fetchUser, token } = useAuthStore();

  // 应用启动时，如果有 token，尝试获取用户信息
  useEffect(() => {
    // 检查 localStorage 中的 token（因为 API 客户端也用它）
    const tokenFromStorage = localStorage.getItem('token');
    if (tokenFromStorage || token) {
      fetchUser();
    }
  }, []); // 只在组件挂载时执行一次

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 需要布局的路由 */}
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <Layout>
                <PostDetail />
              </Layout>
            }
          />
          <Route
            path="/posts/new"
            element={
              <Layout>
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/posts/:id/edit"
            element={
              <Layout>
                <ProtectedRoute>
                  <EditPost />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/users/:id"
            element={
              <Layout>
                <UserProfile />
              </Layout>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <Layout>
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <Search />
              </Layout>
            }
          />
          <Route
            path="/messages"
            element={
              <Layout>
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <Layout>
                <ProtectedRoute>
                  <Conversation />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/notifications"
            element={
              <Layout>
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/resources"
            element={
              <Layout>
                <Resources />
              </Layout>
            }
          />
          <Route
            path="/resources/upload"
            element={
              <Layout>
                <ProtectedRoute>
                  <UploadResource />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* 管理员路由 */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/posts"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminPosts />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/comments"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminComments />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminUsers />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminUserDetail />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminCategories />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminResources />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminStats />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <Suspense fallback={<PageLoader />}>
                  <AdminLogs />
                </Suspense>
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

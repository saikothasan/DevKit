import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

// ==========================================
// 1. High-Performance Code Splitting
// ==========================================
// Lazy load routes to shrink initial bundle and improve core web vitals (LCP/TTI)

const Forum = React.lazy(() => import('./pages/Forum'));
const Thread = React.lazy(() => import('./pages/Thread'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const VIP = React.lazy(() => import('./pages/VIP'));
const Messages = React.lazy(() => import('./pages/Messages'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));

// Utility Tools
const BinChecker = React.lazy(() => import('./pages/BinChecker'));
const CardChecker = React.lazy(() => import('./pages/CardChecker'));
const FakeAddress = React.lazy(() => import('./pages/FakeAddress'));
const TestCards = React.lazy(() => import('./pages/TestCards'));
const IpCheck = React.lazy(() => import('./pages/IpCheck'));

// ==========================================
// 2. Global Query Client Configuration
// ==========================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache queries for 5 minutes (Optimized for Edge D1 reads)
      gcTime: 1000 * 60 * 30, // Garbage collect unused data after 30 mins
      retry: 2, // Exponential backoff retries on failure
      refetchOnWindowFocus: false, // Prevent spamming Cloudflare Workers on alt-tab
    },
  },
});

// ==========================================
// 3. UI/UX: Premium Cryptographic Loader
// ==========================================
const GlobalLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-400">
    <div className="flex flex-col items-center space-y-4">
      {/* Sleek, minimal spinner */}
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-orange-500" />
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Initializing Vector...</span>
    </div>
  </div>
);

// ==========================================
// 4. Zero-Trust Protected Route Wrapper
// ==========================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isVerified) return <Navigate to="/verify-email" replace />;

  return <>{children}</>;
};

// ==========================================
// 5. Routing Architecture (React Router v7)
// ==========================================
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <ToastProvider>
          <Layout>
            <Suspense fallback={<GlobalLoader />}>
              <Outlet />
            </Suspense>
          </Layout>
        </ToastProvider>
      </AuthProvider>
    ),
    errorElement: (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] text-zinc-200">
        <h1 className="mb-2 font-mono text-4xl font-bold text-red-500">System Anomaly</h1>
        <p className="mb-6 text-zinc-500">A catastrophic routing failure occurred.</p>
        <a href="/" className="rounded border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors">
          Reboot Interface
        </a>
      </div>
    ),
    children: [
      // Public Vectors
      { index: true, element: <Navigate to="/forum" replace /> },
      { path: 'forum', element: <Forum /> },
      { path: 'forum/thread/:id', element: <Thread /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile/:username', element: <Profile /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      
      // Tooling Utility Vectors (SEO Indexed)
      { path: 'tools/bin-checker', element: <BinChecker /> },
      { path: 'tools/card-checker', element: <CardChecker /> },
      { path: 'tools/fake-address', element: <FakeAddress /> },
      { path: 'tools/test-cards', element: <TestCards /> },
      { path: 'tools/ip-check', element: <IpCheck /> },

      // Protected/Authenticated Vectors
      { 
        path: 'vip', 
        element: (
          <ProtectedRoute>
            <VIP />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'messages', 
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ) 
      },
      {
        path: '*',
        element: (
          <div className="flex h-[60vh] flex-col items-center justify-center">
            <h2 className="font-mono text-6xl font-black text-zinc-800">404</h2>
            <p className="mt-2 text-sm text-zinc-500">Node untraceable in the directory.</p>
          </div>
        )
      }
    ],
  },
]);

// ==========================================
// 6. Application Bootstrap
// ==========================================
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;

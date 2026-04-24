import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Loader2 } from 'lucide-react';

const Forum = lazy(() => import('@/pages/Forum').then(m => ({ default: m.Forum })));
const IpCheck = lazy(() => import('@/pages/IpCheck').then(m => ({ default: m.IpCheck })));
const Thread = lazy(() => import('@/pages/Thread').then(m => ({ default: m.Thread })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Messages = lazy(() => import('@/pages/Messages').then(m => ({ default: m.Messages })));
const TestCards = lazy(() => import('@/pages/TestCards').then(m => ({ default: m.TestCards })));
const FakeAddress = lazy(() => import('@/pages/FakeAddress').then(m => ({ default: m.FakeAddress })));
const CardChecker = lazy(() => import('@/pages/CardChecker').then(m => ({ default: m.CardChecker })));
const BinChecker = lazy(() => import('@/pages/BinChecker').then(m => ({ default: m.BinChecker })));
const VIPPlan = lazy(() => import('@/pages/VIP').then(m => ({ default: m.VIP })));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Loader2 className="size-10 text-orange-500 animate-spin" />
  </div>
);

// Enterprise Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1, 
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Forum />} />
                <Route path="forum/:id" element={<Thread />} />
                <Route path="vip" element={<VIPPlan />} />
                <Route path="test-cards" element={<TestCards />} />
                <Route path="ip" element={<IpCheck />} />
                <Route path="fake-address" element={<FakeAddress />} />
                <Route path="fake-address/:locale" element={<FakeAddress />} />
                <Route path="card-checker" element={<CardChecker />} />
                <Route path="bin-checker" element={<BinChecker />} />
                <Route path="messages" element={<Messages />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="profile/:username" element={<Profile />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

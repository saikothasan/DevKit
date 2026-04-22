import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Loader2 } from 'lucide-react';

// Code-splitting strategy applied to all heavyweight vectors
const Forum = lazy(() => import('@/pages/Forum'));
const IpCheck = lazy(() => import('@/pages/IpCheck'));
const Thread = lazy(() => import('@/pages/Thread'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Profile = lazy(() => import('@/pages/Profile'));
const Messages = lazy(() => import('@/pages/Messages'));
const TestCards = lazy(() => import('@/pages/TestCards'));
const FakeAddress = lazy(() => import('@/pages/FakeAddress'));
const CardChecker = lazy(() => import('@/pages/CardChecker'));
const BinChecker = lazy(() => import('@/pages/BinChecker'));
const VIPPlan = lazy(() => import('@/pages/VIP'));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Loader2 className="size-10 text-orange-500 animate-spin" />
  </div>
);

export default function App() {
  return (
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
  );
}

import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

// Application Pages
import Forum from '@/pages/Forum';
import Thread from '@/pages/Thread';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';

// Development Tools & Utilities
import TestCards from '@/pages/TestCards';
import FakeAddress from '@/pages/FakeAddress';
import CardChecker from '@/pages/CardChecker';
import BinChecker from '@/pages/BinChecker';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Primary Community Routing */}
            <Route index element={<Forum />} />
            <Route path="forum/:id" element={<Thread />} />
            
            {/* Engineering Utilities Routing */}
            <Route path="test-cards" element={<TestCards />} />
            <Route path="fake-address" element={<FakeAddress />} />
            <Route path="fake-address/:locale" element={<FakeAddress />} />
            <Route path="card-checker" element={<CardChecker />} />
            <Route path="bin-checker" element={<BinChecker />} />
            
            {/* Real-time Data Routing */}
            <Route path="messages" element={<Messages />} />
            
            {/* Identity Access Management Routing */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="profile/:username" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

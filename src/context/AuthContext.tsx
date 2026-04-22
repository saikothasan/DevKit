import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'moderator' | 'user';

export type User = { 
  id: number; 
  username: string; 
  role: UserRole; 
  points: number; 
  avatarUrl?: string | null; 
  isVerified: boolean; 
  isVip: boolean;
  vipSince?: string;
} | null;

interface AuthState {
  user: User;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Unauthenticated');
      const data = await res.json() as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => { refreshUser(); }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be executed within an AuthProvider instance');
  return context;
};

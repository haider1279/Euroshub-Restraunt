import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, setAccessToken } from '../api/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('euroshub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
      localStorage.setItem('euroshub_user', JSON.stringify(data.user));
    } catch {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('euroshub_user');
    } finally {
      setIsLoading(false);
    }
  };

  // On app load, call /api/auth/refresh to restore session using httpOnly cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await apiRequest<{ user: User; accessToken: string }>('/auth/refresh', {
          method: 'POST',
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
        localStorage.setItem('euroshub_user', JSON.stringify(data.user));
      } catch {
        // No active session or refresh token expired
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('euroshub_user');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setAccessToken(data.accessToken);
    localStorage.setItem('euroshub_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
  };

  const register = async (formData: { email: string; password: string; name: string; phone?: string }) => {
    const data = await apiRequest<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    setAccessToken(data.accessToken);
    localStorage.setItem('euroshub_user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success('Registration successful! Welcome to Euroshub Kitchen.');
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setAccessToken(null);
      localStorage.removeItem('euroshub_user');
      setUser(null);
      toast.info('You have been signed out.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

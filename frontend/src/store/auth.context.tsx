/**
 * Authentication context — provides auth state and actions app-wide.
 * Uses localStorage for token persistence.
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { User } from '../types';
import { api } from '../lib/axios';
import { queryClient } from '../App';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // 5-second timeout safeguard to prevent infinite hanging on slow mobile networks
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session restore timeout')), 5000)
      );

      const { data } = (await Promise.race([
        api.get('/auth/me'),
        timeoutPromise,
      ])) as any;

      if (data?.data) {
        dispatch({ type: 'SET_USER', payload: data.data });
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      console.warn('[Auth] Session check failed or timed out:', err);
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // On mount: restore session from stored tokens
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    let isMounted = true;

    if (token) {
      refreshUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Safety fallback: Ensure loading is ALWAYS unblocked within 6 seconds max
    const maxTimer = setTimeout(() => {
      if (isMounted) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 6000);

    // Listen for forced logout events (from axios interceptor)
    const handleForceLogout = () => {
      queryClient.clear();
      dispatch({ type: 'LOGOUT' });
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => {
      isMounted = false;
      clearTimeout(maxTimer);
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, [refreshUser]);

  const login = async (username: string, password: string): Promise<User> => {
    queryClient.clear();
    const { data } = await api.post('/auth/login', { username, email: username, password });
    const { accessToken, refreshToken, user } = data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { useState, useCallback } from 'react';
import type { AuthUser, AuthResponse } from '../types';

const TOKEN_KEY = 'rednote_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

type UseAuthReturn = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signUp: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Invalid credentials');
    }
    const { user, token }: AuthResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Sign up failed');
    }
    const { user, token }: AuthResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return { user, setUser, signIn, signUp, signOut };
}

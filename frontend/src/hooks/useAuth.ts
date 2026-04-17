import { useState, useCallback } from 'react';
import type { AuthUser, AuthResponse } from '../types';

export type UseAuthReturn = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signUp: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error('Invalid username or password');
    }
    const { user }: Pick<AuthResponse, 'user'> = await res.json();
    setUser(user);
    return user;
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Sign up failed');
    }
    const { user }: Pick<AuthResponse, 'user'> = await res.json();
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }, []);

  return { user, setUser, signIn, signUp, signOut };
}

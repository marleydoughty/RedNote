import { useState, type FormEvent } from 'react';
import type { AuthUser } from '../types';
import logoUrl from '../assets/cycle.png';

type Props = {
  onSignIn: (username: string, password: string) => Promise<AuthUser>;
  onSignUp: (username: string, password: string) => Promise<AuthUser>;
};

export default function LoginPage({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'sign-in') {
        await onSignIn(username, password);
      } else {
        await onSignUp(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoUrl} alt="" aria-hidden="true" />
          <h1>RedNote</h1>
        </div>

        <h2 className="login-title">
          {mode === 'sign-in' ? 'Welcome back' : 'Create account'}
        </h2>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete={mode === 'sign-in' ? 'username' : 'new-password'}
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'sign-in' ? 'current-password' : 'new-password'
              }
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? '...' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="login-switch">
          {mode === 'sign-in'
            ? "Don't have an account?"
            : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setError(null);
            }}>
            {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

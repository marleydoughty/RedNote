import { useState, useEffect, type FormEvent } from 'react';
import type { AuthUser } from '../types';
import logoUrl from '../assets/cycle.png';

type Props = {
  onSignIn: (username: string, password: string) => Promise<AuthUser>;
  onSignUp: (username: string, password: string) => Promise<AuthUser>;
};

function getPasswordHints(password: string) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    {
      label: 'One symbol',
      met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];
}

export default function LoginPage({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  // Live username availability check (sign-up only)
  useEffect(() => {
    if (mode !== 'sign-up' || username.length < 2) {
      setUsernameTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(username)}`
        );
        const { available } = await res.json();
        setUsernameTaken(!available);
      } catch {
        // silently ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, mode]);

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
            {mode === 'sign-up' && usernameTaken && (
              <span className="login-error" role="alert">
                Username already taken
              </span>
            )}
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

          {mode === 'sign-up' && password.length > 0 && (
            <ul className="password-hints">
              {getPasswordHints(password).map((h) => (
                <li key={h.label} className={h.met ? 'hint-met' : 'hint-unmet'}>
                  {h.met ? '✓' : '○'} {h.label}
                </li>
              ))}
            </ul>
          )}

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
              setUsernameTaken(false);
            }}>
            {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {mode === 'sign-in' && (
          <button
            type="button"
            className="demo-btn"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await onSignIn('demo', 'Demo123!');
              } catch (err) {
                setError('Demo account unavailable');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}>
            Try Demo Account
          </button>
        )}
      </div>
    </div>
  );
}

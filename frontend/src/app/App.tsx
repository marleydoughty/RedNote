import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import DayModal from '../components/DayModal';
import PredictionBanner from '../components/PredictionBanner';
import LoginPage from '../components/LoginPage';
import SettingsPanel from '../components/SettingsPanel';
import { useEntries } from '../hooks/useEntries';
import { useAuth, getToken } from '../hooks/useAuth';
import logoUrl from '../assets/cycle.png';
import settingsUrl from '../assets/settings.png';
import './App.scss';

export default function App() {
  const { user, setUser, signIn, signUp, signOut } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { entries, markDay, unmarkDay, updateNote } = useEntries(user?.userId);

  // Restore session from token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ userId: payload.userId, username: payload.username ?? '' });
        }
      } catch {
        // invalid token, stay logged out
      }
    }
    setAuthReady(true);
  }, [setUser]);

  if (!authReady) return null;

  if (!user) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-logo" aria-hidden="true">
            <img src={logoUrl} alt="RedNote" />
          </span>
          <h1 className="header-title">RedNote</h1>
        </div>
        <button
          className="settings-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings">
          <img
            src={settingsUrl}
            alt=""
            aria-hidden="true"
            style={{ width: '22px', height: '22px' }}
          />
        </button>
      </header>

      <main className="app-main">
        <PredictionBanner />
        <Calendar entries={entries} onDateClick={setSelectedDate} />
      </main>

      {settingsOpen && (
        <SettingsPanel
          user={user}
          onSignOut={() => {
            signOut();
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {selectedDate && (
        <DayModal
          date={selectedDate}
          entry={entries[selectedDate]}
          onMarkDay={markDay}
          onUnmarkDay={unmarkDay}
          onUpdateNote={updateNote}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

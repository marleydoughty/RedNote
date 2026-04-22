import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import DayModal from '../components/DayModal';
import PredictionBanner from '../components/PredictionBanner';
import PhaseInfoModal from '../components/PhaseInfoModal';
import LoginPage from '../components/LoginPage';
import SettingsPanel from '../components/SettingsPanel';
import DemoTour from '../components/DemoTour';
import Legend from '../components/Legend';
import { useEntries } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import logoUrl from '../assets/cycle.png';
import settingsUrl from '../assets/settings.png';
import './App.scss';

export default function App() {
  const { user, setUser, signIn, signUp, signOut } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phaseInfoOpen, setPhaseInfoOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { entries, markDay, markRange, unmarkDay, updateNote } = useEntries(
    user?.userId
  );

  // Restore session from cookie on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          // Show tour for demo user every time
          if (data.user.username === 'demo') {
            setTimeout(() => setShowTour(true), 500);
          }
        }
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, [setUser]);

  if (!authReady) return null;

  if (!user) {
    return (
      <LoginPage
        onSignIn={async (username, password) => {
          const user = await signIn(username, password);
          // Show tour for demo user after sign in
          if (user.username === 'demo') {
            setTimeout(() => setShowTour(true), 500);
          }
          return user;
        }}
        onSignUp={signUp}
      />
    );
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
        <PredictionBanner onPhaseClick={() => setPhaseInfoOpen(true)} />
        <Calendar entries={entries} onDateClick={setSelectedDate} />
        <Legend />
      </main>

      {phaseInfoOpen && (
        <PhaseInfoModal onClose={() => setPhaseInfoOpen(false)} />
      )}

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
          onMarkRange={markRange}
          onUnmarkDay={unmarkDay}
          onUpdateNote={updateNote}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {showTour && (
        <DemoTour
          onComplete={() => {
            setShowTour(false);
          }}
        />
      )}
    </div>
  );
}

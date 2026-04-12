import { useState } from 'react';
import Calendar from './components/Calendar';
import DayModal from './components/DayModal';
import PredictionBanner from './components/PredictionBanner';
import { useEntries } from './hooks/useEntries';
import './App.scss';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { entries, markDay, unmarkDay, updateNote } = useEntries();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-logo" aria-hidden="true">
            🌹
          </span>
          <h1 className="header-title">RedNote</h1>
        </div>
      </header>

      <main className="app-main">
        <PredictionBanner />
        <Calendar entries={entries} onDateClick={setSelectedDate} />
      </main>

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

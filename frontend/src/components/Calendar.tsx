import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import type { DateClickArg } from '@fullcalendar/interaction/index.js';
import type { EventInput } from '@fullcalendar/core/index.js';
import type { CycleEntry, Prediction } from '../types';

type Props = {
  entries: Record<string, CycleEntry>;
  onDateClick: (date: string) => void;
};

/** Convert a FullCalendar UTC date to a YYYY-MM-DD string */
function fcDateStr(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Calendar({ entries, onDateClick }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    fetch('/api/predict')
      .then((r) => r.json())
      .then((data) => setPredictions(data.predictions ?? []))
      .catch(() => {});
  }, [entries]);

  const periodDateSet = new Set(
    Object.values(entries)
      .filter((e) => e.isPeriod)
      .map((e) => e.date)
  );
  const predictDateSet = new Set(predictions.map((p) => p.date));

  // Period days as background events
  const periodEvents: EventInput[] = [...periodDateSet].map((date) => ({
    id: `period-${date}`,
    date,
    display: 'background',
    backgroundColor: 'rgba(232, 84, 122, 0.28)',
  }));

  // Predicted days as background events
  const predictedEvents: EventInput[] = predictions.map((p) => ({
    id: `pred-${p.date}`,
    date: p.date,
    display: 'background',
    backgroundColor: 'rgba(155, 112, 212, 0.18)',
  }));

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next',
        }}
        dateClick={(arg: DateClickArg) => onDateClick(arg.dateStr)}
        events={[...periodEvents, ...predictedEvents]}
        height="auto"
        dayCellClassNames={(arg) => {
          const ds = fcDateStr(arg.date);
          const classes: string[] = [];
          if (periodDateSet.has(ds)) classes.push('is-period-day');
          if (predictDateSet.has(ds) && !periodDateSet.has(ds))
            classes.push('is-predicted-day');
          if (entries[ds]?.notes) classes.push('has-note');
          return classes;
        }}
      />
    </div>
  );
}

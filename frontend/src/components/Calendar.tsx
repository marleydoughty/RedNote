import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import type { DateClickArg } from '@fullcalendar/interaction/index.js';
import type { EventInput } from '@fullcalendar/core/index.js';
import type { CycleEntry, Prediction } from '../types';
import { getToken } from '../hooks/useAuth';
import { toUTCDateStr, toDateStr } from '../utils/dateUtils';

type Props = {
  entries: Record<string, CycleEntry>;
  onDateClick: (date: string) => void;
};

/** Convert a FullCalendar UTC date to a YYYY-MM-DD string */
function fcDateStr(date: Date): string {
  return toUTCDateStr(date);
}

export default function Calendar({ entries, onDateClick }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    fetch('/api/predict', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setPredictions(data.predictions ?? []))
      .catch(() => {});
  }, [entries]);

  const periodDateSet = new Set(
    Object.values(entries)
      .filter((e) => e.isPeriod)
      .map((e) => e.date)
  );
  const predictDateSet = new Set(
    predictions.flatMap((p) => {
      return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(`${p.date}T00:00:00`);
        d.setDate(d.getDate() - 2 + i);
        return toDateStr(d);
      });
    })
  );

  const ovulationDateSet = new Set(
    predictions.flatMap((p) => {
      return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(`${p.date}T00:00:00`);
        d.setDate(d.getDate() - (16 - i));
        return toDateStr(d);
      });
    })
  );

  // Period days as background events
  const periodEvents: EventInput[] = [...periodDateSet].map((date) => ({
    id: `period-${date}`,
    date,
    display: 'background',
    backgroundColor: 'rgba(232, 84, 122, 0.28)',
  }));

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'today',
          center: 'title',
          right: 'prev next',
        }}
        dateClick={(arg: DateClickArg) => onDateClick(arg.dateStr)}
        events={[...periodEvents]}
        height="100%"
        dayCellClassNames={(arg) => {
          const ds = fcDateStr(arg.date);
          const classes: string[] = [];
          if (periodDateSet.has(ds)) classes.push('is-period-day');
          if (predictDateSet.has(ds) && !periodDateSet.has(ds))
            classes.push('is-predicted-day');
          if (ovulationDateSet.has(ds)) classes.push('is-ovulation-day');
          if (entries[ds]?.notes) classes.push('has-note');
          return classes;
        }}
      />
    </div>
  );
}

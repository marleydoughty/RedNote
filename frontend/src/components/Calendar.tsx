import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import type { DateClickArg } from '@fullcalendar/interaction/index.js';
import type { EventInput } from '@fullcalendar/core/index.js';
import type { CycleEntry, Prediction } from '../types';
import { toUTCDateStr, toDateStr } from '../utils/dateUtils';
import {
  OVULATION_WINDOW_END,
  PREDICTION_WINDOW_DAYS,
} from '../constants/cycleConstants';

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
    console.log('📅 Calendar: Fetching predictions, entries changed');
    fetch('/api/predict', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        console.log('📊 Calendar: Received predictions:', data);
        setPredictions(data.predictions ?? []);
      })
      .catch((err) => {
        console.error('❌ Calendar: Error fetching predictions:', err);
      });
  }, [entries]);

  const periodDateSet = new Set(
    Object.values(entries)
      .filter((e) => e.isPeriod)
      .map((e) => e.date)
  );
  const predictDateSet = new Set(
    predictions.flatMap((p) => {
      return Array.from({ length: PREDICTION_WINDOW_DAYS }, (_, i) => {
        const d = new Date(`${p.date}T00:00:00`);
        d.setDate(d.getDate() - 2 + i);
        return toDateStr(d);
      });
    })
  );

  const ovulationDateSet = new Set(
    predictions.flatMap((p) => {
      return Array.from({ length: PREDICTION_WINDOW_DAYS }, (_, i) => {
        const d = new Date(`${p.date}T00:00:00`);
        d.setDate(d.getDate() - (OVULATION_WINDOW_END - i));
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

import { useState, useEffect } from 'react';
import type { CycleEntry } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';

type Props = {
  date: string;
  entry: CycleEntry | undefined;
  onMarkDay: (
    date: string,
    isPeriod: boolean,
    notes?: string
  ) => Promise<CycleEntry>;
  onMarkRange: (startDate: string, endDate: string) => Promise<void>;
  onUnmarkDay: (date: string) => Promise<void>;
  onUpdateNote: (
    date: string,
    notes: string,
    isPeriod: boolean
  ) => Promise<CycleEntry>;
  onClose: () => void;
};

export default function DayModal({
  date,
  entry,
  onMarkDay,
  onMarkRange,
  onUnmarkDay,
  onUpdateNote,
  onClose,
}: Props) {
  const [isPeriod, setIsPeriod] = useState(entry?.isPeriod ?? false);
  const [endDate, setEndDate] = useState(date);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsPeriod(entry?.isPeriod ?? false);
    setNotes(entry?.notes ?? '');
    setEndDate(date);
  }, [entry, date]);

  const formattedDate = formatDisplayDate(date);

  const isRange = isPeriod && endDate > date;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isRange) {
        await onMarkRange(date, endDate);
      } else if (entry) {
        if (!isPeriod && !notes.trim()) {
          await onUnmarkDay(date);
        } else {
          await onUpdateNote(date, notes.trim(), isPeriod);
        }
      } else if (isPeriod || notes.trim()) {
        await onMarkDay(date, isPeriod, notes.trim() || undefined);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await onUnmarkDay(date);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        role="button"
        aria-label="Close"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Log entry for ${formattedDate}`}>
        <div className="modal-handle" />
        <div className="modal-content">
          <h2 className="modal-date">{formattedDate}</h2>

          <label className="period-toggle-label">
            <span>Period day</span>
            <button
              id="period-toggle"
              className={`toggle-btn ${isPeriod ? 'is-active' : ''}`}
              onClick={() => setIsPeriod((p) => !p)}
              type="button"
              aria-pressed={isPeriod}>
              <span className="toggle-thumb" />
            </button>
          </label>

          {isPeriod && (
            <label className="range-field">
              <span>Ends on</span>
              <input
                type="date"
                value={endDate}
                min={date}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="Period end date"
              />
            </label>
          )}

          {!isRange && (
            <textarea
              id="day-notes"
              className="notes-input"
              placeholder="Add a note for this day…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              aria-label="Day notes"
            />
          )}

          <div className="modal-actions">
            {entry && (
              <button
                id="remove-entry-btn"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isSaving}>
                Remove
              </button>
            )}
            <button
              id="save-entry-btn"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}>
              {isSaving
                ? 'Saving…'
                : isRange
                ? `Save ${
                    Math.round(
                      (new Date(`${endDate}T00:00:00`).getTime() -
                        new Date(`${date}T00:00:00`).getTime()) /
                        86400000
                    ) + 1
                  } days`
                : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

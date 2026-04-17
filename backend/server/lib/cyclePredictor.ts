import {
  DEFAULT_CYCLE_LENGTH,
  MIN_CYCLE_GAP_DAYS,
  OVULATION_WINDOW_END,
  PREDICTION_COUNT,
} from '../constants/cycleConstants.js';

function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type Prediction = {
  date: string;
  confidence: 'high' | 'medium' | 'low';
};

export type PredictResult = {
  predictions: Prediction[];
  averageCycleLength: number | null;
  ovulationDays: string[];
  nextPeriodStart: string | null;
};

export function predictCycles(dates: Date[]): PredictResult {
  if (dates.length === 0) {
    return {
      predictions: [],
      averageCycleLength: null,
      ovulationDays: [],
      nextPeriodStart: null,
    };
  }

  const dateSet = new Set(dates.map(utcDateStr));

  const rawStarts = dates.filter((d) => {
    const prev = new Date(d);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return !dateSet.has(utcDateStr(prev));
  });

  const startDates = rawStarts.filter((d, i) => {
    if (i === 0) return true;
    const daysSincePrev =
      (d.getTime() - rawStarts[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePrev >= MIN_CYCLE_GAP_DAYS;
  });

  const lastStart = startDates[startDates.length - 1];
  let avgCycle = DEFAULT_CYCLE_LENGTH;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (startDates.length >= 2) {
    const totalDays = startDates
      .slice(1)
      .reduce(
        (sum, d, i) =>
          sum + (d.getTime() - startDates[i].getTime()) / (1000 * 60 * 60 * 24),
        0
      );
    avgCycle = Math.round(totalDays / (startDates.length - 1));
    confidence = startDates.length >= 3 ? 'high' : 'medium';
  }

  const predictions = Array.from({ length: PREDICTION_COUNT }, (_, i) => {
    const predicted = new Date(lastStart);
    predicted.setUTCDate(predicted.getUTCDate() + avgCycle * (i + 1));
    return { date: utcDateStr(predicted), confidence };
  });

  const nextPeriodStart = predictions[0]?.date ?? null;
  const ovulationDays: string[] = [];

  if (nextPeriodStart) {
    const ovulationDate = new Date(`${nextPeriodStart}T00:00:00Z`);
    ovulationDate.setUTCDate(ovulationDate.getUTCDate() - OVULATION_WINDOW_END);
    ovulationDays.push(utcDateStr(ovulationDate));
  }

  return {
    predictions,
    averageCycleLength: avgCycle,
    ovulationDays,
    nextPeriodStart,
  };
}

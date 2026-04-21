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
  console.log('🔮 predictCycles called with', dates.length, 'period dates');

  if (dates.length === 0) {
    return {
      predictions: [],
      averageCycleLength: null,
      ovulationDays: [],
      nextPeriodStart: null,
    };
  }

  const dateSet = new Set(dates.map(utcDateStr));
  console.log('📅 All period dates:', Array.from(dateSet).sort());

  const rawStarts = dates.filter((d) => {
    const prev = new Date(d);
    prev.setUTCDate(prev.getUTCDate() - 1);
    return !dateSet.has(utcDateStr(prev));
  });
  console.log('🎯 Raw cycle starts detected:', rawStarts.map(utcDateStr));

  const startDates = rawStarts.filter((d, i) => {
    if (i === 0) return true;
    const daysSincePrev =
      (d.getTime() - rawStarts[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePrev >= MIN_CYCLE_GAP_DAYS;
  });
  console.log(
    '✅ Filtered cycle starts (min gap applied):',
    startDates.map(utcDateStr)
  );

  const lastStart = startDates[startDates.length - 1];
  let avgCycle = DEFAULT_CYCLE_LENGTH;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (startDates.length >= 2) {
    const cycleLengths = startDates.slice(1).map((d, i) => {
      const length =
        (d.getTime() - startDates[i].getTime()) / (1000 * 60 * 60 * 24);
      console.log(
        `  Cycle ${i + 1}: ${utcDateStr(startDates[i])} → ${utcDateStr(
          d
        )} = ${length} days`
      );
      return length;
    });

    const totalDays = cycleLengths.reduce((sum, len) => sum + len, 0);
    avgCycle = Math.round(totalDays / (startDates.length - 1));
    confidence = startDates.length >= 3 ? 'high' : 'medium';

    console.log(
      '📊 Average cycle length:',
      avgCycle,
      'days (confidence:',
      confidence + ')'
    );
  } else {
    console.log(
      '⚠️ Not enough cycles for calculation, using default:',
      DEFAULT_CYCLE_LENGTH
    );
  }

  const predictions = Array.from({ length: PREDICTION_COUNT }, (_, i) => {
    const predicted = new Date(lastStart);
    predicted.setUTCDate(predicted.getUTCDate() + avgCycle * (i + 1));
    return { date: utcDateStr(predicted), confidence };
  });

  console.log(
    '🔮 Predictions:',
    predictions.map((p) => p.date)
  );

  const nextPeriodStart = predictions[0]?.date ?? null;
  const ovulationDays: string[] = [];

  if (nextPeriodStart) {
    const ovulationDate = new Date(`${nextPeriodStart}T00:00:00Z`);
    ovulationDate.setUTCDate(ovulationDate.getUTCDate() - OVULATION_WINDOW_END);
    ovulationDays.push(utcDateStr(ovulationDate));
  }

  console.log('✨ Final result:', { nextPeriodStart, avgCycle, confidence });

  return {
    predictions,
    averageCycleLength: avgCycle,
    ovulationDays,
    nextPeriodStart,
  };
}

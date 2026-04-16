import { useEffect, useState } from 'react';
import type { PredictResponse } from '../types';
import predictIcon from '../assets/predict.png';
import { getToken } from '../hooks/useAuth';

export default function PredictionBanner() {
  const [data, setData] = useState<PredictResponse | null>(null);

  useEffect(() => {
    fetch('/api/predict', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.predictions.length === 0) return null;

  const next = data.predictions[0];
  const nextDate = new Date(`${next.date}T00:00:00`);
  const formatted = nextDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntil = Math.round(
    (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysText =
    daysUntil === 0
      ? 'today'
      : daysUntil > 0
      ? `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
      : `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`;

  let phaseLabel = 'Follicular phase';

  if (daysUntil <= 0 && daysUntil > -5) phaseLabel = 'Period';
  else if (daysUntil >= 12 && daysUntil <= 16) phaseLabel = 'Ovulating';
  else if (daysUntil >= 1 && daysUntil < 12) phaseLabel = 'Luteal phase';
  else phaseLabel = 'Follicular phase';

  return (
    <div className="prediction-banner" role="status" aria-live="polite">
      <span className="prediction-icon" aria-hidden="true">
        <img
          src={predictIcon}
          alt=""
          style={{ width: '30px', height: '30px' }}
        />
      </span>

      <div className="prediction-text">
        <span className="prediction-label">Next cycle predicted</span>
        <span className="prediction-date">
          {formatted} · {daysText}
        </span>
      </div>

      <span className="phase-badge" title="Current cycle phase">
        {phaseLabel}
      </span>
    </div>
  );
}

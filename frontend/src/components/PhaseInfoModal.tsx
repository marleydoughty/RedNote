import { useState } from 'react';

import menstrualIcon from '../assets/menstrual-phase.png';
import follicularIcon from '../assets/follicular-phase.png';
import ovulationIcon from '../assets/ovulation-phase.png';
import lutealIcon from '../assets/luteal-phase.png';

type Props = {
  onClose: () => void;
};

function PhaseSection({
  title,
  iconSrc,
  children,
}: {
  title: string;
  iconSrc: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="settings-accordion">
      <button
        className="settings-accordion-header"
        onClick={() => setOpen((o) => !o)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={iconSrc}
            alt=""
            style={{ width: '18px', height: '18px' }}
            aria-hidden="true"
          />
          {title}
        </span>
        <span className="settings-accordion-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="settings-accordion-body">{children}</div>}
    </div>
  );
}

export default function PhaseInfoModal({ onClose }: Props) {
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
        aria-label="Menstrual Cycle Phases"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-handle" />
        <div className="modal-content" style={{ overflow: 'auto', flex: 1 }}>
          <h2
            className="modal-date"
            style={{
              position: 'sticky',
              top: 0,
              background: 'var(--bg-elevated)',
              paddingBottom: '0.5rem',
              zIndex: 1,
            }}>
            Cycle Phases
          </h2>

          <PhaseSection title="Menstrual Phase" iconSrc={menstrualIcon}>
            <p className="settings-about-text">
              <strong>Days 1-5 of your cycle</strong>
            </p>
            <p className="settings-about-text">
              This is when you have your period. The uterine lining sheds,
              causing bleeding. Hormone levels (estrogen and progesterone) are
              at their lowest.
            </p>
            <p className="settings-about-text">
              <strong>What you might feel:</strong> Fatigue, cramps, mood
              changes, lower energy. Rest and self-care are important during
              this phase.
            </p>
          </PhaseSection>

          <PhaseSection title="Follicular Phase" iconSrc={follicularIcon}>
            <p className="settings-about-text">
              <strong>Days 1-13 of your cycle</strong>
            </p>
            <p className="settings-about-text">
              Overlaps with menstruation but continues after bleeding stops.
              Estrogen rises as follicles in the ovaries mature. The uterine
              lining begins to thicken again.
            </p>
            <p className="settings-about-text">
              <strong>What you might feel:</strong> Increasing energy, improved
              mood, better focus. This is often when you feel your best
              physically and mentally.
            </p>
          </PhaseSection>

          <PhaseSection title="Ovulation Phase" iconSrc={ovulationIcon}>
            <p className="settings-about-text">
              <strong>Around day 14 (mid-cycle)</strong>
            </p>
            <p className="settings-about-text">
              A mature egg is released from the ovary. Estrogen peaks and
              luteinizing hormone (LH) surges. This is your most fertile window.
            </p>
            <p className="settings-about-text">
              <strong>What you might feel:</strong> Peak energy, heightened
              senses, increased libido, clearer skin. Some may experience mild
              cramping or spotting.
            </p>
          </PhaseSection>

          <PhaseSection title="Luteal Phase" iconSrc={lutealIcon}>
            <p className="settings-about-text">
              <strong>Days 15-28 of your cycle</strong>
            </p>
            <p className="settings-about-text">
              After ovulation, progesterone rises to prepare the uterus for
              potential pregnancy. If no pregnancy occurs, hormone levels drop,
              triggering menstruation.
            </p>
            <p className="settings-about-text">
              <strong>What you might feel:</strong> PMS symptoms like bloating,
              breast tenderness, mood swings, food cravings, fatigue. Energy
              gradually decreases as you approach your period.
            </p>
          </PhaseSection>

          <div
            className="modal-actions"
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--bg-elevated)',
              paddingTop: '1rem',
            }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={onClose}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

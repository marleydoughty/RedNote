import { useState } from 'react';
import type { AuthUser } from '../types';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
  onClose: () => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="settings-accordion">
      <button
        className="settings-accordion-header"
        onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className="settings-accordion-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="settings-accordion-body">{children}</div>}
    </div>
  );
}

export default function SettingsPanel({ user, onSignOut, onClose }: Props) {
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
        aria-label="Settings">
        <div className="modal-handle" />
        <div className="modal-content">
          <h2 className="modal-date">Settings</h2>

          <Section title="About">
            <p className="settings-about-text">
              RedNote is a personal cycle tracking app that helps you log your
              period and predict future cycles based on your data.
            </p>
            <p className="settings-credits">
              Icons by{' '}
              <a
                href="https://www.flaticon.com"
                target="_blank"
                rel="noreferrer">
                Flaticon
              </a>
            </p>
          </Section>

          <Section title="FAQ">
            <div className="settings-faq">
              <p className="faq-q">How do predictions work?</p>
              <p className="faq-a">
                RedNote calculates the average length of your cycles from your
                logged period data and uses that to predict your next cycle.
              </p>

              <p className="faq-q">How much data do I need?</p>
              <p className="faq-a">
                At least 2–3 cycles for a reliable prediction. The more you log,
                the more accurate it gets.
              </p>

              <p className="faq-q">Why is my prediction off?</p>
              <p className="faq-a">
                Make sure all your period days are logged correctly with no
                gaps. A missing day can split one cycle into two and throw off
                the average. Also, avoid logging future dates as they can
                interfere with the cycle calculations.
              </p>
            </div>
          </Section>

          <div className="settings-account">
            <div className="settings-profile">
              <div className="settings-avatar" aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="settings-profile-info">
                <p className="settings-username">{user.username}</p>
                <p className="settings-user-id">@{user.username}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

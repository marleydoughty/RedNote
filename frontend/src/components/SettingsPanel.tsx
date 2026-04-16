import type { AuthUser } from '../types';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
  onClose: () => void;
};

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
          <h2 className="modal-date">Profile</h2>

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
    </>
  );
}

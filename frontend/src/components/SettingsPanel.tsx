import type { AuthUser } from '../types';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
  onClose: () => void;
};

export default function SettingsPanel({ user, onSignOut, onClose }: Props) {
  return (
    <>
      <div className="settings-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="settings-panel" role="dialog" aria-label="Settings">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-section">
          <p className="settings-section-label">Profile</p>
          <div className="settings-profile">
            <div className="settings-avatar" aria-hidden="true">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="settings-username">{user.username}</p>
              <p className="settings-user-id">ID #{user.userId}</p>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <p className="settings-section-label">Account</p>
          <button className="settings-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

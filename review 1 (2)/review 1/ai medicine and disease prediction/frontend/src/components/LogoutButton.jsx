import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LogoutButton
 *
 * Props:
 *   className  — extra Tailwind classes (optional)
 *   compact    — show icon only (optional, default false)
 */
export default function LogoutButton({ className = '', compact = false }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await logout();           // clears localStorage + axios header
    navigate('/select-role', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      title="Logout"
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-xl
        text-sm font-semibold
        text-red-600 bg-red-50
        border border-red-200
        hover:bg-red-600 hover:text-white hover:border-red-600
        active:scale-95
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {busy ? (
        /* spinner */
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        /* logout icon */
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )}
      {!compact && <span>{busy ? 'Logging out…' : 'Logout'}</span>}
    </button>
  );
}

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ currentTab, onOpenAuth, onOpenHowItWorks }) {
  const { user, activeRole, accentTheme, toggleTheme } = useAuth();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'discover':
        return 'Discover Chargers';
      case 'bookings':
        return 'My Bookings';
      case 'host-chargers':
        return 'My Charging Points';
      case 'add-charger':
        return 'Register Charger';
      case 'host-requests':
        return 'Booking Requests';
      default:
        return 'Overview';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        WattStop <span>/</span> <strong>{getPageTitle()}</strong>
      </div>

      <div className="top-actions flex items-center gap-4">
        {/* Theme Accent Switcher (Volt Lime / Electric Orange) */}
        <button
          onClick={toggleTheme}
          className="text-xs px-2.5 py-1 rounded-full border border-gray-200 hover:border-gray-300 bg-white font-medium flex items-center gap-1.5 transition text-gray-700 shadow-sm"
          title="Switch Accent Theme"
        >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: accentTheme === 'lime' ? '#b9ee45' : '#ff6b35' }}
          ></span>
          <span className="capitalize">{accentTheme === 'lime' ? 'Volt Lime' : 'Electric Orange'}</span>
        </button>

        <span className="preview-label">
          <i></i> LIVE NETWORK
        </span>

        <button
          className="icon-button"
          onClick={onOpenHowItWorks}
          aria-label="About WattStop"
          title="About WattStop"
        >
          ⓘ
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="top-avatar" title={`${user.name} (${user.role})`}>
              {getInitials(user.name)}
            </span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-xs font-bold bg-[#252b24] text-white hover:bg-black px-3.5 py-1.5 rounded-md transition"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

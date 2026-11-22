import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentTab, setCurrentTab, onOpenAuth, onOpenHowItWorks }) {
  const { user, activeRole, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleNavClick = (tabId, e) => {
    e.preventDefault();
    if (tabId === 'how-it-works') {
      onOpenHowItWorks();
    } else {
      setCurrentTab(tabId);
    }
  };

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand Header from Reference */}
      <a
        className="brand"
        href="#overview"
        onClick={(e) => handleNavClick('overview', e)}
        aria-label="WattStop home"
      >
        <span className="brand-mark">ϟ</span>
        <span>
          wattstop<span className="brand-dot">.</span>
          <small>CHARGE A LITTLE CLOSER</small>
        </span>
      </a>

      <div className="workspace-label">WORKSPACE</div>

      {/* Navigation */}
      <nav className="navigation" aria-label="Dashboard navigation">
        <a
          className={`nav-link ${currentTab === 'overview' ? 'active' : ''}`}
          href="#overview"
          onClick={(e) => handleNavClick('overview', e)}
        >
          <span>◫</span> Overview
        </a>

        {activeRole === 'driver' ? (
          <>
            <a
              className={`nav-link ${currentTab === 'discover' ? 'active' : ''}`}
              href="#discover"
              onClick={(e) => handleNavClick('discover', e)}
            >
              <span>⌖</span> Discover chargers
            </a>
            <a
              className={`nav-link ${currentTab === 'bookings' ? 'active' : ''}`}
              href="#bookings"
              onClick={(e) => handleNavClick('bookings', e)}
            >
              <span>▣</span> My bookings
            </a>
          </>
        ) : (
          <>
            <a
              className={`nav-link ${currentTab === 'host-chargers' ? 'active' : ''}`}
              href="#host-chargers"
              onClick={(e) => handleNavClick('host-chargers', e)}
            >
              <span>⌂</span> My chargers
            </a>
            <a
              className={`nav-link ${currentTab === 'add-charger' ? 'active' : ''}`}
              href="#add-charger"
              onClick={(e) => handleNavClick('add-charger', e)}
            >
              <span>✚</span> Add a charger
            </a>
            <a
              className={`nav-link ${currentTab === 'host-requests' ? 'active' : ''}`}
              href="#host-requests"
              onClick={(e) => handleNavClick('host-requests', e)}
            >
              <span>▣</span> Booking requests
            </a>
          </>
        )}

        <a
          className={`nav-link ${currentTab === 'how-it-works' ? 'active' : ''}`}
          href="#how-it-works"
          onClick={(e) => handleNavClick('how-it-works', e)}
        >
          <span>♡</span> How it works
        </a>
      </nav>

      {/* Sidebar Bottom & User Profile */}
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-icon">✳</span>
          <strong>Good energy travels.</strong>
          <p>Better journeys start with a little help from your community.</p>
        </div>

        {user ? (
          <div className="profile">
            <span className="avatar">{getInitials(user.name)}</span>
            <div className="flex-1 min-w-0">
              <strong className="truncate">{user.name}</strong>
              <small className="capitalize">{user.role} Account</small>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="text-xs text-red-500 hover:text-red-700 font-semibold p-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className="profile cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
            onClick={onOpenAuth}
          >
            <span className="avatar">G</span>
            <div className="flex-1 min-w-0">
              <strong>Guest explorer</strong>
              <small className="text-lime-700 font-semibold">Click to Sign In / Join</small>
            </div>
            <span className="profile-more">···</span>
          </div>
        )}
      </div>
    </aside>
  );
}

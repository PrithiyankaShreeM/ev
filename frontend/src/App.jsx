import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DriverDashboard from './components/DriverDashboard';
import HomeownerDashboard from './components/HomeownerDashboard';
import MyBookingsView from './components/MyBookingsView';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import ChargerDetailModal from './components/ChargerDetailModal';
import HowItWorksModal from './components/HowItWorksModal';
import SarvamVoiceAssistant from './components/SarvamVoiceAssistant';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { activeRole, switchRole, user } = useAuth();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState('overview');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [selectedChargerForDetail, setSelectedChargerForDetail] = useState(null);
  const [selectedChargerForBooking, setSelectedChargerForBooking] = useState(null);

  // Handle action triggers from Voice Assistant
  const handleVoiceActionTrigger = (actionResult) => {
    if (actionResult.booking) {
      setCurrentTab('bookings');
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'host-chargers' || tab === 'add-charger' || tab === 'host-requests') {
            switchRole('homeowner');
          } else if (tab === 'discover' || tab === 'bookings') {
            switchRole('driver');
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main" id="overview">
        <Topbar
          currentTab={currentTab}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        />

        <div className="content">
          {/* Welcome Row from Reference */}
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <span></span> YOUR CHARGING COMPANION
              </div>
              <h1>
                Good to see you{user ? `, ${user.name.split(' ')[0]}` : ''}
                <span className="green-dot">.</span>
              </h1>
              <p className="subtitle">A little charge can take you a long way.</p>
            </div>
            <div className="date-block">
              <span>YOUR SPACE</span>
              <strong>
                Ready when you are <span>↗</span>
              </strong>
            </div>
          </div>

          {/* Role Switcher Tabs from Reference */}
          <div className="role-switch" aria-label="Choose dashboard">
            <button
              className={`role ${activeRole === 'driver' ? 'active' : ''}`}
              data-role="driver"
              aria-pressed={activeRole === 'driver'}
              onClick={() => {
                switchRole('driver');
                if (currentTab.startsWith('host-')) setCurrentTab('overview');
              }}
            >
              Driver dashboard
            </button>
            <button
              className={`role ${activeRole === 'homeowner' ? 'active' : ''}`}
              data-role="homeowner"
              aria-pressed={activeRole === 'homeowner'}
              onClick={() => switchRole('homeowner')}
            >
              Homeowner dashboard
            </button>
          </div>

          {/* Role-Specific Views */}
          {activeRole === 'driver' ? (
            currentTab === 'bookings' ? (
              <MyBookingsView
                onExploreChargers={() => setCurrentTab('discover')}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : (
              <DriverDashboard
                onSelectCharger={(charger) => setSelectedChargerForDetail(charger)}
                onBookCharger={(charger) => setSelectedChargerForBooking(charger)}
                onViewBookings={() => setCurrentTab('bookings')}
                onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
              />
            )
          ) : (
            <HomeownerDashboard onOpenAuth={() => setIsAuthOpen(true)} />
          )}

          {/* Footer from Reference */}
          <footer>
            <span>© 2026 WATTSTOP</span>
            <span>
              MADE FOR THE JOURNEY AHEAD <b>✳</b>
            </span>
          </footer>
        </div>
      </main>

      {/* Floating Sarvam AI Voice Assistant */}
      <SarvamVoiceAssistant onActionTrigger={handleVoiceActionTrigger} />

      {/* Application Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <ChargerDetailModal
        charger={selectedChargerForDetail}
        isOpen={Boolean(selectedChargerForDetail)}
        onClose={() => setSelectedChargerForDetail(null)}
        onBookNow={(charger) => setSelectedChargerForBooking(charger)}
      />

      <BookingModal
        charger={selectedChargerForBooking}
        isOpen={Boolean(selectedChargerForBooking)}
        onClose={() => setSelectedChargerForBooking(null)}
        onBookingSuccess={() => {
          // Switch to bookings tab to see the confirmed booking
          setCurrentTab('bookings');
        }}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}

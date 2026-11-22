import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('driver'); // 'driver' | 'homeowner'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name,
          email,
          phone,
          password,
          role,
          vehicle: {
            model: vehicleModel || 'EV',
            connectorType: 'Type 2',
            batteryCapacityKw: 50
          }
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demo accounts
  const handleQuickDemo = (demoType) => {
    if (demoType === 'driver') {
      setEmail('karthik.driver@wattstop.in');
      setPassword('password123');
      setIsRegister(false);
    } else {
      setEmail('priya.host@wattstop.in');
      setPassword('password123');
      setIsRegister(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="dialog-close absolute top-5 right-5 text-gray-400 hover:text-black font-bold text-lg"
        >
          ×
        </button>

        <span className="mini-label">ACCOUNT ACCESS</span>
        <h2 className="text-2xl font-bold font-display mt-1">
          {isRegister ? 'Join the WattStop Community' : 'Welcome back to WattStop'}
          <span className="green-dot">.</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-5">
          {isRegister
            ? 'Create an account to book residential chargers or list your home wallbox.'
            : 'Sign in to access your bookings, routes, and host management.'}
        </p>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              {/* Account Type Selection */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">I am registering as:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-2 px-3 rounded-md border font-bold transition text-xs ${
                      role === 'driver'
                        ? 'bg-[#252b24] text-white border-[#252b24]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🚗 EV Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('homeowner')}
                    className={`py-2 px-3 rounded-md border font-bold transition text-xs ${
                      role === 'homeowner'
                        ? 'bg-[#252b24] text-white border-[#252b24]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🏠 Homeowner / Host
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Raja"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98401 23456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
              </div>

              {role === 'driver' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">EV Model (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Nexon EV, MG ZS EV, Hyundai Ioniq 5"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-lime-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full justify-center py-3 text-xs font-bold mt-2"
          >
            {loading ? 'Please wait...' : isRegister ? 'Complete Registration ↗' : 'Sign In ↗'}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 uppercase font-bold block mb-2 text-center">
            Or test with seeded demo accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo('driver')}
              className="p-2 border border-gray-200 rounded bg-[#f8f9f6] hover:bg-[#edf2e7] text-gray-800 font-semibold text-center transition"
            >
              👤 Demo Driver
            </button>
            <button
              onClick={() => handleQuickDemo('host')}
              className="p-2 border border-gray-200 rounded bg-[#f8f9f6] hover:bg-[#edf2e7] text-gray-800 font-semibold text-center transition"
            >
              🏠 Demo Host
            </button>
          </div>
        </div>

        {/* Switch between Login and Register */}
        <div className="mt-4 text-center text-xs text-gray-500">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="font-bold text-black hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="font-bold text-black hover:underline"
              >
                Register as Driver or Host
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

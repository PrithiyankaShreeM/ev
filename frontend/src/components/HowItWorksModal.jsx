import React from 'react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[85vh] overflow-y-auto font-sans">
        <button
          onClick={onClose}
          className="dialog-close absolute top-5 right-5 text-gray-400 hover:text-black font-bold text-lg"
        >
          ×
        </button>

        <span className="mini-label">ABOUT WATTSTOP</span>
        <h2 className="text-2xl font-bold font-display mt-1">
          Route-Based EV Home Charging<span className="green-dot">.</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          Better journeys start with a little help from your community.
        </p>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <div className="p-3.5 bg-[#f8f9f6] rounded-lg border border-gray-100">
            <strong className="block text-gray-900 font-bold mb-1">01 / The Mission</strong>
            <p>
              WattStop bridges electric vehicle drivers with local homeowners who have residential wallbox chargers. Instead of waiting at crowded commercial stations, drivers can top up conveniently in peaceful residential neighborhoods along their travel path.
            </p>
          </div>

          <div className="p-3.5 bg-[#f8f9f6] rounded-lg border border-gray-100">
            <strong className="block text-gray-900 font-bold mb-1">02 / Route-Based Corridor Discovery</strong>
            <p>
              Enter your departure point and destination. WattStop calculates the driving route using OpenStreetMap & OSRM, discovering home chargers located within a configurable 3–5 km corridor along your drive.
            </p>
          </div>

          <div className="p-3.5 bg-[#f8f9f6] rounded-lg border border-gray-100">
            <strong className="block text-gray-900 font-bold mb-1">03 / Sarvam AI Voice Assistant</strong>
            <p>
              WattStop features hands-free AI voice control powered by Sarvam AI. With Sarvam Saaras for multilingual Speech-to-Text and Bulbul for natural Text-to-Speech, drivers can speak commands in English, Tamil, or Thanglish while driving:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 font-medium">
              <li>"Enakku nearby charging station find pannu"</li>
              <li>"Next charger enga irukku?"</li>
              <li>"Free charger book pannu"</li>
              <li>"Route-la charging point irukka?"</li>
            </ul>
          </div>

          <div className="p-3.5 bg-[#f8f9f6] rounded-lg border border-gray-100">
            <strong className="block text-gray-900 font-bold mb-1">04 / Homeowner Hosting</strong>
            <p>
              Hosts can register chargers on the interactive map, configure connector types (Type 2, CCS, CHAdeMO), set free or paid pricing models (₹/kWh or ₹/hr), specify available days and time windows, and accept or decline reservation requests.
            </p>
          </div>
        </div>

        <button onClick={onClose} className="primary-button w-full justify-center mt-5 text-xs py-2.5">
          Got it <span>→</span>
        </button>
      </div>
    </div>
  );
}

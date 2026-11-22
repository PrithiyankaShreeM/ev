import React from 'react';

export default function ChargerDetailModal({ charger, isOpen, onClose, onBookNow }) {
  if (!isOpen || !charger) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="dialog-close absolute top-5 right-5 text-gray-400 hover:text-black font-bold text-lg"
        >
          ×
        </button>

        {/* Photo Header */}
        {charger.photos && charger.photos.length > 0 && (
          <div className="h-44 w-full rounded-lg overflow-hidden mb-4 bg-gray-100">
            <img
              src={charger.photos[0]}
              alt={charger.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="mini-label">VERIFIED HOST CHARGING POINT</span>
              <h2 className="text-xl font-bold font-display mt-0.5">{charger.name}</h2>
              <p className="text-xs text-gray-500">{charger.address}</p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                charger.isFree
                  ? 'bg-green-100 text-green-800'
                  : 'bg-lime-100 text-lime-900'
              }`}
            >
              {charger.isFree ? 'Free to charge' : `₹${charger.pricing?.pricePerKwh ?? 15} / kWh`}
            </span>
          </div>

          {charger.description && (
            <p className="text-xs text-gray-600 leading-relaxed bg-[#f8f9f6] p-3 rounded-md border border-gray-100">
              {charger.description}
            </p>
          )}

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Power Mode</span>
              <strong className="text-gray-800">{charger.acDcType || 'AC'} Charging</strong>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Connector</span>
              <strong className="text-gray-800">{charger.connectorType}</strong>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Capacity</span>
              <strong className="text-gray-800">{charger.capacityKw} kW</strong>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Connectors</span>
              <strong className="text-gray-800">{charger.numberOfConnectors || 1} available</strong>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Hourly Rate</span>
              <strong className="text-gray-800">
                {charger.isFree ? 'Free' : `₹${charger.pricing?.pricePerHour || 40}/hr`}
              </strong>
            </div>

            <div className="p-2.5 bg-gray-50 rounded border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Host Verified</span>
              <strong className="text-green-700">✓ WattStop Community</strong>
            </div>
          </div>

          {/* Host Instructions */}
          {charger.instructions && (
            <div className="p-3 bg-[#f0f5e9] rounded-md border border-[#ddebce] text-xs">
              <strong className="text-lime-900 block mb-1">Host Instructions:</strong>
              <p className="text-gray-700">{charger.instructions}</p>
            </div>
          )}

          {/* Operating Hours */}
          {charger.availableSlots && charger.availableSlots.length > 0 && (
            <div className="text-xs text-gray-500">
              Operating hours: <strong>{charger.availableSlots[0].startTime}</strong> to{' '}
              <strong>{charger.availableSlots[0].endTime}</strong>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookNow(charger);
              }}
              className="primary-button text-xs font-bold py-2.5 px-6"
            >
              Reserve a Slot <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

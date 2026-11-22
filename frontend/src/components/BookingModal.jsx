import React, { useState } from 'react';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookingModal({ charger, isOpen, onClose, onBookingSuccess }) {
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [vehicleInfo, setVehicleInfo] = useState(user?.vehicle?.model || 'Tata Nexon EV');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Card' | 'Cash'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  if (!isOpen || !charger) return null;

  // Calculate duration and price
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const durationHours = Math.max(0.5, ((eH * 60 + eM) - (sH * 60 + sM)) / 60);

  const pricePerHour = charger.pricing?.pricePerHour || 40;
  const estimatedCost = charger.isFree ? 0 : Math.round(durationHours * pricePerHour);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in before booking a charger.');
      return;
    }

    if (durationHours <= 0) {
      setError('End time must be later than start time.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await bookingApi.create({
        chargerId: charger._id,
        date,
        startTime,
        endTime,
        vehicleInfo,
        paymentMethod: charger.isFree ? 'Free' : paymentMethod
      });

      setSuccessBooking(res.booking);
      if (onBookingSuccess) onBookingSuccess(res.booking);
    } catch (err) {
      setError(err.message || 'Slot conflict or booking error. Please select another time.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code data URL using SVG
  const qrVerificationCode = successBooking?.verificationCode || `WATT-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrDataText = encodeURIComponent(
    `WATTSTOP-PASS|ID:${successBooking?._id || 'TEMP'}|CODE:${qrVerificationCode}|DRIVER:${user?.name || 'Driver'}|CHARGER:${charger.name}|DATE:${date}`
  );
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrDataText}&color=20-37-31&bgcolor=248-249-246`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="dialog-close absolute top-5 right-5 text-gray-400 hover:text-black font-bold text-lg"
        >
          ×
        </button>

        {successBooking ? (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xl mx-auto">
              ✓
            </div>
            <span className="mini-label">RESERVATION & ENTRY PASS CONFIRMED</span>
            <h2 className="text-2xl font-bold font-display">You're All Set!</h2>
            <p className="text-xs text-gray-500">
              Charging reserved at <strong>{charger.name}</strong> for{' '}
              <strong>{date}</strong> ({startTime} - {endTime}).
            </p>

            {/* Host Verification QR Code */}
            <div className="p-4 bg-[#f8f9f6] rounded-xl border border-gray-200 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-800 block">
                Show this QR Code to Host for Verification
              </span>
              <div className="flex justify-center p-2 bg-white rounded-lg border border-gray-100 shadow-inner w-fit mx-auto">
                <img
                  src={qrImageUrl}
                  alt="Host Verification QR Code"
                  className="w-40 h-40 object-contain rounded"
                />
              </div>
              <div className="text-xs font-mono font-bold text-gray-800 bg-gray-100 py-1 px-3 rounded inline-block">
                PASS CODE: {qrVerificationCode}
              </div>
              <p className="text-[10px] text-gray-500">
                The host will scan or verify this code upon arrival to activate the plug.
              </p>
            </div>

            <div className="p-3 bg-[#f8f9f6] rounded-md text-xs border border-gray-200 text-left space-y-1">
              <div>Address: <strong>{charger.address}</strong></div>
              <div>Payment Mode: <strong className="text-green-700 font-bold">{successBooking.paymentMethod || paymentMethod}</strong></div>
              <div>Total Amount: <strong>{charger.isFree ? 'Free' : `₹${successBooking.totalAmount || estimatedCost}`}</strong></div>
              <div>Host Instructions: <em>{charger.instructions || 'Ring bell upon arrival.'}</em></div>
            </div>

            <button onClick={onClose} className="primary-button w-full justify-center">
              Done & Return to Map <span>→</span>
            </button>
          </div>
        ) : (
          <>
            <span className="mini-label">RESERVE CHARGER</span>
            <h2 className="text-xl font-bold font-display mt-1">{charger.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{charger.address}</p>

            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Charging Date</label>
                <input
                  type="date"
                  min={todayStr}
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Vehicle Model</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV, MG ZS EV"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none"
                />
              </div>

              {/* Payment Method Selector (UPI / Card / Cash) */}
              {!charger.isFree && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'UPI'
                          ? 'border-lime-500 bg-lime-50 text-black ring-1 ring-lime-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">📱</span>
                      <span>UPI Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Card')}
                      className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'Card'
                          ? 'border-lime-500 bg-lime-50 text-black ring-1 ring-lime-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">💳</span>
                      <span>Card / Net</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center gap-1 transition ${
                        paymentMethod === 'Cash'
                          ? 'border-lime-500 bg-lime-50 text-black ring-1 ring-lime-400'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base">💵</span>
                      <span>Cash at Host</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="p-3 bg-[#f0f5e9] rounded-md border border-[#ddebce]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">Duration:</span>
                  <strong className="text-gray-900">{durationHours} hour{durationHours > 1 ? 's' : ''}</strong>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">Rate:</span>
                  <span className="text-gray-900">{charger.isFree ? 'Free to charge' : `₹${pricePerHour}/hr`}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#ddebce] text-sm">
                  <span className="font-bold text-gray-800">Total Payable:</span>
                  <strong className="text-green-800 font-display text-base">
                    {charger.isFree ? 'Free' : `₹${estimatedCost}`}
                  </strong>
                </div>
                {!charger.isFree && (
                  <div className="text-[10px] text-gray-500 mt-1">
                    Selected payment: <strong>{paymentMethod}</strong> (Includes entry QR pass)
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full justify-center py-3 text-xs font-bold"
              >
                {loading ? 'Confirming Reservation & Generating Pass...' : 'Confirm & Generate Host QR Pass ↗'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

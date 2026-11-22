import React, { useState, useEffect } from 'react';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsView({ onExploreChargers, onOpenAuth }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await bookingApi.getMyBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.warn('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this charging reservation?');
    if (!confirmCancel) return;

    try {
      setCancellingId(bookingId);
      await bookingApi.cancel(bookingId, 'Cancelled by driver');
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-[#eceee9] rounded-[9px] p-8 text-center my-6 max-w-lg mx-auto">
        <div className="side-icon mx-auto">▣</div>
        <h2 className="text-xl font-bold font-display">Sign In to View Bookings</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-2">
          Your active charging stops, upcoming reservations, and receipt history are stored securely in your WattStop account.
        </p>
        <button onClick={onOpenAuth} className="primary-button mt-5 mx-auto">
          Sign In / Create Account <span>→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eceee9] pb-4">
        <div>
          <span className="mini-label">RESERVATION MANAGEMENT</span>
          <h2 className="text-2xl font-bold font-display mt-1">My Charging Bookings</h2>
          <p className="text-xs text-gray-500">Track and manage your upcoming EV stops across the community.</p>
        </div>
        <button onClick={onExploreChargers} className="primary-button text-xs font-bold py-2 px-4 self-start sm:self-auto">
          + Book Another Charger <span>↗</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 bg-white border border-[#eceee9] rounded-[9px] text-center space-y-3">
          <span className="text-3xl block">🔌</span>
          <h3 className="font-bold text-base font-display">Nothing on the calendar yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You don't have any upcoming charging reservations. Explore residential chargers along your route to reserve a spot.
          </p>
          <button onClick={onExploreChargers} className="primary-button text-xs mx-auto mt-3">
            Explore Nearby Chargers <span>↗</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => {
            const charger = b.charger || {};
            const isCancellable = b.status === 'confirmed' || b.status === 'pending';

            return (
              <div
                key={b._id}
                className="bg-white border border-[#eceee9] rounded-[9px] p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-gray-900">{charger.name || 'Home Charger'}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{charger.address || 'Address provided by host'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : b.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      ● {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-[#f8f9f6] p-3 rounded-md border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Date</span>
                      <strong className="text-gray-800">{b.date}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Reserved Time</span>
                      <strong className="text-gray-800">{b.startTime} - {b.endTime}</strong>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Vehicle</span>
                      <strong className="text-gray-800">{b.vehicleInfo || 'EV'}</strong>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
                      <strong className="text-green-800">{b.isFree ? 'Free' : `₹${b.totalAmount}`}</strong>
                    </div>
                  </div>

                  {charger.instructions && (
                    <div className="mt-3 text-[11px] text-gray-600 bg-[#f0f5e9] p-2.5 rounded border border-[#ddebce]">
                      <strong>Host notes:</strong> {charger.instructions}
                    </div>
                  )}

                  {b.status === 'cancelled' && b.cancellationReason && (
                    <div className="mt-2 text-[11px] text-red-700 italic">
                      Reason: {b.cancellationReason}
                    </div>
                  )}
                </div>

                {isCancellable && (
                  <div className="pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleCancelBooking(b._id)}
                      disabled={cancellingId === b._id}
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded border border-red-200 hover:bg-red-50 transition"
                    >
                      {cancellingId === b._id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, DollarSign, X, 
  Check, AlertCircle, Filter, ChevronDown 
} from 'lucide-react';
import { Toast } from '../../components/Toast';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_URL}/checkout/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      } else {
        showNotification('Failed to fetch bookings', 'error');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = getToken();

      const response = await fetch(`${API_URL}/checkout/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`Booking cancelled. Refund: $${data.refund_amount}`, 'success');
        fetchBookings(); // Refresh list
      } else {
        showNotification(data.error || 'Failed to cancel booking', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('Network error', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  // Helper for Status Badge Styles
  const getStatusStyles = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const isSessionInPast = (date, startTime) => {
    const sessionDateTime = new Date(`${date}T${startTime}`);
    return sessionDateTime <= new Date();
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'confirmed' && !isSessionInPast(booking.date, booking.start_time);
  };

  // Group bookings
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && !isSessionInPast(b.date, b.start_time)
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || (b.status === 'confirmed' && isSessionInPast(b.date, b.start_time))
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Notification Toast */}
      <Toast notification={notification} />

      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-6 border-b border-gray-200">
          {/* Header */}
          <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                    Bookings
                  </h1>
                  <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-1">Manage your bookings</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Select Filter */}
          <div className="mt-4 sm:mt-0 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-slate-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-400 text-sm">Loading your schedule...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No bookings found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">You haven't booked any sessions yet. Once you do, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Upcoming Bookings */}
            {!statusFilter && upcomingBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 pl-1">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={canCancelBooking(booking)}
                      getStatusStyles={getStatusStyles}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {!statusFilter && pastBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 pl-1">Past History</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={false}
                      getStatusStyles={getStatusStyles}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Cancelled Bookings */}
            {!statusFilter && cancelledBookings.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 pl-1">Cancelled</h2>
                <div className="space-y-4">
                  {cancelledBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={false}
                      getStatusStyles={getStatusStyles}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Filtered View */}
            {statusFilter && (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.booking_id}
                    booking={booking}
                    onCancel={handleCancelBooking}
                    cancelling={cancellingId === booking.booking_id}
                    canCancel={canCancelBooking(booking)}
                    getStatusStyles={getStatusStyles}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Booking Card
function BookingCard({ booking, onCancel, cancelling, canCancel, getStatusStyles }) {
  // Format dates cleanly
  const dateObj = new Date(booking.date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const yearNum = dateObj.toLocaleDateString('en-US', { year: 'numeric' });

  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-5 sm:p-6 transition-all duration-200 hover:border-indigo-300 hover:shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Side: Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between lg:justify-start gap-4 mb-5">
            <h3 className="text-lg font-bold text-slate-900">{booking.class_type}</h3>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${getStatusStyles(booking.status)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4">
            {/* Trainer */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Trainer</div>
                <div className="font-medium text-slate-700 text-sm truncate">{booking.trainer_name}</div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Date</div>
                <div className="font-medium text-slate-700 text-sm">
                   {monthName} {dayNum}, {yearNum}
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Time</div>
                <div className="font-medium text-slate-700 text-sm whitespace-nowrap">{booking.start_time} - {booking.end_time}</div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">Price</div>
                <div className="font-bold text-slate-900 text-sm">${booking.price.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action */}
        <div className="flex items-center justify-end lg:border-l lg:border-gray-100 lg:pl-6">
          {canCancel ? (
            <button
              onClick={() => onCancel(booking.booking_id)}
              disabled={cancelling}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-md transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              {cancelling ? 'Processing...' : 'Cancel Booking'}
            </button>
          ) : (
             <div className="hidden lg:block text-right">
                <div className="text-xs text-slate-400">Booked on</div>
                <div className="text-xs font-medium text-slate-600">
                    {new Date(booking.booked_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                    })}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
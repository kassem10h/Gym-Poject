import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, X, Check, AlertCircle, Filter } from 'lucide-react';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isSessionInPast = (date, startTime) => {
    const sessionDateTime = new Date(`${date}T${startTime}`);
    return sessionDateTime <= new Date();
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'confirmed' && !isSessionInPast(booking.date, booking.start_time);
  };

  // Group bookings by status
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && !isSessionInPast(b.date, b.start_time)
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || (b.status === 'confirmed' && isSessionInPast(b.date, b.start_time))
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your training session bookings</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">All Bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <span className="text-sm text-gray-600">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">Start booking training sessions to see them here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            {!statusFilter && upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={canCancelBooking(booking)}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {!statusFilter && pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Sessions</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={false}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Bookings */}
            {!statusFilter && cancelledBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cancelled Sessions</h2>
                <div className="space-y-4">
                  {cancelledBookings.map((booking) => (
                    <BookingCard
                      key={booking.booking_id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      cancelling={cancellingId === booking.booking_id}
                      canCancel={false}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
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
                    getStatusColor={getStatusColor}
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

// Booking Card Component
function BookingCard({ booking, onCancel, cancelling, canCancel, getStatusColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">{booking.class_type}</h3>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Trainer</div>
                <div className="font-medium">{booking.trainer_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-medium">
                  {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Time</div>
                <div className="font-medium">{booking.start_time} - {booking.end_time}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Price</div>
                <div className="font-bold text-lg text-gray-900">${booking.price.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Booked on {new Date(booking.booked_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => onCancel(booking.booking_id)}
            disabled={cancelling}
            className="ml-4 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}
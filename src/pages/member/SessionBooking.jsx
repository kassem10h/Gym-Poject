import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Users, Plus, ShoppingCart, Filter, Check, AlertCircle, X } from 'lucide-react';
import useSessionCart from '../../hooks/useSessionCart';
import SessionCartModal from '../../components/SessionCartModal';

export default function SessionBookingPage() {
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassType, setSelectedClassType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const { sessionCart, addToSessionCart, removeFromSessionCart, loading: cartLoading } = useSessionCart();

  const getToken = () => localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch available sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();

      if (selectedClassType) params.append('class_type_id', selectedClassType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`${API_URL}/session-cart/available?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        showNotification('Failed to fetch sessions', 'error');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch class types
  const fetchClassTypes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/class-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClassTypes(data.class_types || []);
      }
    } catch (error) {
      console.error('Error fetching class types:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedClassType, dateFrom, dateTo]);

  useEffect(() => {
    fetchClassTypes();
  }, []);

  const handleAddToCart = async (sessionId) => {
    const result = await addToSessionCart(sessionId);
    if (result.success) {
      showNotification('Session added to cart!', 'success');
      // Refresh sessions to update availability
      fetchSessions();
    } else {
      showNotification(result.error || 'Failed to add session', 'error');
    }
  };

  const clearFilters = () => {
    setSelectedClassType('');
    setDateFrom('');
    setDateTo('');
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Training Sessions</h1>
              <p className="mt-1 text-sm text-gray-500">Browse and book sessions with our trainers</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Session Cart</span>
              {sessionCart && sessionCart.total_items > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full">
                  {sessionCart.total_items}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4"
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <select
                  value={selectedClassType}
                  onChange={(e) => setSelectedClassType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {classTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <button
                onClick={clearFilters}
                className="md:col-span-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions available</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-indigo-600 text-white px-6 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {groupedSessions[date].map(session => (
                    <div
                      key={session.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{session.class_type}</h3>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-full">
                              {session.trainer_name}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="w-5 h-5 text-gray-400" />
                              <span className="font-medium">{session.start_time} - {session.end_time}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="w-5 h-5 text-gray-400" />
                              <span>
                                {session.spots_remaining} / {session.max_members} spots left
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-5 h-5 text-gray-400" />
                              <span className="text-2xl font-bold text-gray-900">${session.price}</span>
                            </div>

                            <button
                              onClick={() => handleAddToCart(session.id)}
                              disabled={cartLoading || session.is_full}
                              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-5 h-5" />
                              {session.is_full ? 'Full' : 'Add to Cart'}
                            </button>
                          </div>

                          {session.spots_remaining <= 3 && session.spots_remaining > 0 && (
                            <div className="mt-3 text-sm text-orange-600 font-medium">
                              ⚠️ Only {session.spots_remaining} spots remaining!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Cart Modal */}
      {showCart && (
        <SessionCartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          sessionCart={sessionCart}
          removeFromSessionCart={removeFromSessionCart}
          loading={cartLoading}
        />
      )}
    </div>
  );
}
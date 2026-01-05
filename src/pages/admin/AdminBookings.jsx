import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, TrendingUp, TrendingDown,
  Search, Filter, X, ChevronDown, Trash2, Power,
  UserCheck, DollarSign, MapPin, Award, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Eye, Ban
} from 'lucide-react';

// --- Configuration ---
const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export default function AdminBookingManagement() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, sessions, bookings
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // --- Data Fetching ---
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const response = await fetch(`${API_URL}/bookings/dashboard`, { headers });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const response = await fetch(`${API_URL}/bookings/sessions?per_page=50`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Sessions Fetch Error:", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const url = filterStatus === 'all' 
        ? `${API_URL}/bookings/all?per_page=50`
        : `${API_URL}/bookings/all?status=${filterStatus}&per_page=50`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Bookings Fetch Error:", err);
    }
  };

  const viewSessionDetails = async (sessionId) => {
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const response = await fetch(`${API_URL}/bookings/sessions/${sessionId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.session);
        setShowSessionModal(true);
      }
    } catch (err) {
      console.error("Session Details Error:", err);
    }
  };

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    try {
      const headers = { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_URL}/bookings/sessions/${sessionId}/toggle`, {
        method: 'PATCH',
        headers
      });
      if (response.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error("Toggle Status Error:", err);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session? Use force=true to cancel all bookings.')) return;
    
    try {
      const headers = { 'Authorization': `Bearer ${getToken()}` };
      const response = await fetch(`${API_URL}/bookings/sessions/${sessionId}?force=true`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        fetchSessions();
        fetchDashboard();
      }
    } catch (err) {
      console.error("Delete Session Error:", err);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    
    try {
      const headers = { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers
      });
      if (response.ok) {
        fetchBookings();
        fetchDashboard();
      }
    } catch (err) {
      console.error("Cancel Booking Error:", err);
    }
  };

  const completeBooking = async (bookingId) => {
    try {
      const headers = { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_URL}/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error("Complete Booking Error:", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchSessions();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [filterStatus]);

  const filteredSessions = sessions.filter(session => 
    searchQuery === '' || 
    session.trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.class_type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    searchQuery === '' ||
    booking.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 font-sans">
      
      {/* --- Top Navigation / Control Bar --- */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tighter">Booking Management</h1>
            <div className="h-4 w-[1px] bg-zinc-200 hidden md:block" />
            <div className="hidden md:flex gap-1 bg-zinc-50 p-1 rounded-xl">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'sessions', label: 'Sessions' },
                { id: 'bookings', label: 'Bookings' }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => {
              fetchDashboard();
              fetchSessions();
              fetchBookings();
            }}
            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        {(activeTab === 'sessions' || activeTab === 'bookings') && (
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            
            {activeTab === 'bookings' && (
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {filterStatus !== 'all' && (
                    <span className="w-2 h-2 bg-zinc-900 rounded-full" />
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50">
                    {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                          filterStatus === status 
                            ? 'bg-zinc-900 text-white' 
                            : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === 'overview' && dashboardStats && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <KPICard 
                label="Total Sessions" 
                value={dashboardStats.total_sessions}
                subtitle={`${dashboardStats.today_sessions} Today`}
                icon={Calendar}
                accent="bg-zinc-900 text-white"
              />
              <KPICard 
                label="Active Bookings" 
                value={dashboardStats.total_bookings}
                subtitle={`${dashboardStats.upcoming_sessions} Upcoming`}
                icon={CheckCircle2}
              />
              <KPICard 
                label="Completed" 
                value={dashboardStats.completed_bookings}
                icon={UserCheck}
              />
              <KPICard 
                label="Total Revenue" 
                value={`$${dashboardStats.total_revenue.toLocaleString()}`}
                icon={DollarSign}
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-zinc-100 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500">Success Rate</p>
                    <p className="text-2xl font-black">
                      {((dashboardStats.completed_bookings / dashboardStats.total_bookings) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-100 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500">Cancelled</p>
                    <p className="text-2xl font-black">{dashboardStats.cancelled_bookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-100 rounded-[28px] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500">Upcoming Sessions</p>
                    <p className="text-2xl font-black">{dashboardStats.upcoming_sessions}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- SESSIONS TAB --- */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">No sessions found</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          session.is_active 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {session.is_active ? 'Active' : 'Inactive'}
                        </div>
                        {session.is_full && (
                          <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-yellow-50 text-yellow-700">
                            Full
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-black mb-2">{session.class_type.name}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Trainer</p>
                          <p className="font-bold">{session.trainer.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Date & Time</p>
                          <p className="font-bold">{session.date}</p>
                          <p className="text-xs text-zinc-500">{session.start_time} - {session.end_time}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Capacity</p>
                          <p className="font-bold">{session.current_bookings}/{session.max_members}</p>
                          <p className="text-xs text-zinc-500">{session.spots_remaining} spots left</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Price</p>
                          <p className="font-bold text-zinc-900">${session.price}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => viewSessionDetails(session.id)}
                        className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleSessionStatus(session.id, session.is_active)}
                        className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors"
                        title={session.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className={`w-4 h-4 ${session.is_active ? 'text-green-600' : 'text-zinc-400'}`} />
                      </button>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">No bookings found</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div 
                  key={booking.booking_id}
                  className="bg-white border border-zinc-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                          booking.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                          booking.status === 'completed' ? 'bg-green-50 text-green-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Member</p>
                          <p className="font-bold">{booking.member.name}</p>
                          <p className="text-xs text-zinc-500">{booking.member.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Session</p>
                          <p className="font-bold">{booking.session.class_type}</p>
                          <p className="text-xs text-zinc-500">{booking.session.date} at {booking.session.start_time}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Trainer</p>
                          <p className="font-bold">{booking.trainer.name}</p>
                          <p className="text-xs text-zinc-500">${booking.session.price}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => completeBooking(booking.booking_id)}
                            className="p-2 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                            title="Mark Complete"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => cancelBooking(booking.booking_id)}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                            title="Cancel Booking"
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black mb-2">{selectedSession.class_type.name}</h2>
                <p className="text-sm text-zinc-500">{selectedSession.class_type.description}</p>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">Trainer</p>
                <p className="font-bold">{selectedSession.trainer.name}</p>
                <p className="text-xs text-zinc-500">{selectedSession.trainer.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">Schedule</p>
                <p className="font-bold">{selectedSession.date}</p>
                <p className="text-xs text-zinc-500">{selectedSession.start_time} - {selectedSession.end_time}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">Capacity</p>
                <p className="font-bold">{selectedSession.current_bookings}/{selectedSession.max_members}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">Price</p>
                <p className="font-bold">${selectedSession.price}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-wider text-zinc-900 mb-4">
                Bookings ({selectedSession.bookings.length})
              </p>
              <div className="space-y-3">
                {selectedSession.bookings.map((booking) => (
                  <div key={booking.booking_id} className="bg-zinc-50 rounded-2xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{booking.member.name}</p>
                        <p className="text-xs text-zinc-500">{booking.member.email}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---
function KPICard({ label, value, subtitle, icon: Icon, accent = "bg-white border border-zinc-100 shadow-sm" }) {
  return (
    <div className={`p-6 rounded-[28px] ${accent} transition-transform hover:scale-[1.02] cursor-default`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-xl ${accent.includes('bg-zinc-900') ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest ${accent.includes('bg-zinc-900') ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {label}
      </p>
      <h4 className="text-3xl font-black mt-1 tracking-tighter">{value}</h4>
      {subtitle && <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase">{subtitle}</p>}
    </div>
  );
}
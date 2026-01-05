import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, DollarSign, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrainerSchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [filterClassType, setFilterClassType] = useState('all');
  const [classTypes, setClassTypes] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

  const getToken = () => localStorage.getItem('token');

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        
        // Extract unique class types
        const types = [...new Set(data.sessions.map(s => s.class_type))];
        setClassTypes(types);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getWeekDays = (date) => {
    const days = [];
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      days.push(day);
    }
    return days;
  };

  const getSessionsForDate = (date) => {
    // Create date string in YYYY-MM-DD format in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return sessions.filter(session => {
        const matchesDate = session.date === dateStr;
        const matchesFilter = filterClassType === 'all' || session.class_type === filterClassType;
        return matchesDate && matchesFilter;
    });
    };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const changeWeek = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (increment * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDayMouseEnter = (e, date, daySessions) => {
    if (daySessions.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setHoveredDay({ date, sessions: daySessions });
    }
  };

  const handleDayMouseLeave = () => {
    setHoveredDay(null);
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-32 bg-gray-50 border border-gray-200" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySessions = getSessionsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      days.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: day * 0.01 }}
          onMouseEnter={(e) => handleDayMouseEnter(e, date, daySessions)}
          onMouseLeave={handleDayMouseLeave}
          className={`min-h-32 border border-gray-200 p-2 transition-all hover:bg-gray-50 cursor-pointer ${
            isPast ? 'bg-gray-50' : 'bg-white'
          } ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${
              isToday ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 
              isPast ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {day}
            </span>
            {daySessions.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium"
              >
                {daySessions.length}
              </motion.span>
            )}
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {daySessions.slice(0, 3).map((session, idx) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSession(session)}
                className="text-xs p-1.5 bg-zinc-800 text-white rounded cursor-pointer hover:shadow-md transition-all"
              >
                <div className="font-medium truncate">{session.class_type}</div>
                <div className="opacity-90">{formatTime(session.start_time)}</div>
              </motion.div>
            ))}
            {daySessions.length > 3 && (
              <div className="text-xs text-indigo-600 font-medium pl-1.5">
                +{daySessions.length - 3} more
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    
    return weekDays.map((date, index) => {
      const daySessions = getSessionsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);

      return (
        <div key={index} className="flex-1 border-r border-gray-200 last:border-r-0">
          <div className={`p-3 border-b border-gray-200 text-center ${
            isToday ? 'bg-indigo-50' : isPast ? 'bg-gray-50' : 'bg-white'
          }`}>
            <div className="text-xs text-gray-500 uppercase">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={`text-xl font-bold mt-1 ${
              isToday ? 'text-indigo-600' : isPast ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {date.getDate()}
            </div>
          </div>
          <div className="p-2 space-y-2 min-h-[500px]">
            {daySessions.map(session => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="font-semibold text-sm mb-1">{session.class_type}</div>
                <div className="text-xs opacity-90 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(session.start_time)} - {formatTime(session.end_time)}
                </div>
                <div className="text-xs opacity-90 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" />
                  {session.current_bookings}/{session.max_members}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translateX(-50%) translateY(-100%)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
            className="bg-gray-900 text-white rounded-lg shadow-2xl p-3 max-w-xs"
          >
            <div className="text-xs font-semibold text-gray-300 mb-2">
              {hoveredDay.date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="space-y-2">
              {hoveredDay.sessions.map((session, idx) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2 border-b border-gray-700 last:border-0 pb-2 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white truncate">
                      {session.class_type}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{session.current_bookings}/{session.max_members} members</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-sm text-gray-500">View your training sessions calendar</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => viewMode === 'month' ? changeMonth(-1) : changeWeek(-1)}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 border-x border-gray-300 min-w-[200px] text-center">
                  <span className="font-semibold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                </div>
                <button
                  onClick={() => viewMode === 'month' ? changeMonth(1) : changeWeek(1)}
                  className="p-2 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-1.5 text-sm rounded transition-colors ${
                    viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-gray-600'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-1.5 text-sm rounded transition-colors ${
                    viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-gray-600'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          {classTypes.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                value={filterClassType}
                onChange={(e) => setFilterClassType(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {classTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {filterClassType !== 'all' && (
                <button
                  onClick={() => setFilterClassType('all')}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {viewMode === 'month' ? (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {renderMonthView()}
              </div>
            </>
          ) : (
            <div className="flex">
              {renderWeekView()}
            </div>
          )}
        </div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
        >
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {sessions.filter(s => filterClassType === 'all' || s.class_type === filterClassType).length}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-indigo-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {sessions
                    .filter(s => filterClassType === 'all' || s.class_type === filterClassType)
                    .reduce((sum, s) => sum + s.current_bookings, 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Capacity</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {sessions.length > 0
                    ? Math.round(
                        (sessions
                          .filter(s => filterClassType === 'all' || s.class_type === filterClassType)
                          .reduce((sum, s) => sum + (s.current_bookings / s.max_members), 0) /
                          sessions.filter(s => filterClassType === 'all' || s.class_type === filterClassType).length) *
                          100
                      )
                    : 0}%
                </p>
              </div>
              <Users className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full transform"
            >
              <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold text-white">Session Details</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedSession(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="p-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSession.class_type}</h3>
                  <p className="text-gray-500 mt-1">
                    {new Date(selectedSession.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.03 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: 1.03 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold text-gray-900">${selectedSession.price}</p>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Bookings</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {selectedSession.current_bookings} / {selectedSession.max_members}
                      </p>
                      {selectedSession.is_full && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium"
                        >
                          FULL
                        </motion.span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedSession.current_bookings / selectedSession.max_members) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-zinc-900 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSession(null)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
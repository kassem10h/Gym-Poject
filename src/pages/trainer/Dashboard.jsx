import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Calendar, Users, TrendingUp, Clock, ChevronRight,
  Dumbbell, Star, BookOpen, BarChart3,
  User2
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function TrainerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    totalBookings: 0,
    averageCapacity: 0,
    totalRevenue: 0,
    nextSession: null,
    recentSessions: [],
    popularClass: null,
    classTypes: []
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [sessionsRes, classTypesRes] = await Promise.all([
        fetch(`${API_URL}/sessions/`, { headers }), 
        fetch(`${API_URL}/sessions/class-types`, { headers })
      ]);

      const sessionsData = await sessionsRes.json();
      const classTypesData = await classTypesRes.json();

      const sessions = sessionsData.sessions || [];
      const classTypes = classTypesData.class_types || [];

      // Get current date/time for filtering
      const now = new Date();
      
      // Filter upcoming sessions
      const upcomingSessions = sessions.filter(s => {
        const sessionDate = new Date(`${s.date}T${s.start_time}`);
        return sessionDate > now;
      }).sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.start_time}`);
        const dateB = new Date(`${b.date}T${b.start_time}`);
        return dateA - dateB;
      });

      // Calculate total bookings
      const totalBookings = sessions.reduce((acc, s) => acc + s.current_bookings, 0);

      // Calculate average capacity
      const avgCapacity = sessions.length > 0
        ? Math.round((sessions.reduce((acc, s) => acc + (s.current_bookings / s.max_members), 0) / sessions.length) * 100)
        : 0;

      // Calculate total revenue (price * current bookings)
      const totalRevenue = sessions.reduce((acc, s) => acc + (s.price * s.current_bookings), 0);

      // Find most popular class type
      const classBookings = {};
      sessions.forEach(s => {
        if (!classBookings[s.class_type]) {
          classBookings[s.class_type] = 0;
        }
        classBookings[s.class_type] += s.current_bookings;
      });

      const popularClass = Object.keys(classBookings).length > 0
        ? Object.entries(classBookings).reduce((a, b) => a[1] > b[1] ? a : b)
        : null;

      // Get recent sessions (last 3 with bookings)
      const recentWithBookings = sessions
        .filter(s => s.current_bookings > 0)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);

      setData({
        totalSessions: sessions.length,
        upcomingSessions: upcomingSessions.length,
        totalBookings,
        averageCapacity: avgCapacity,
        totalRevenue,
        nextSession: upcomingSessions[0] || null,
        recentSessions: recentWithBookings,
        popularClass: popularClass ? { name: popularClass[0], bookings: popularClass[1] } : null,
        classTypes
      });

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-600 mt-1">Your training business overview at a glance.</p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Upcoming Sessions Stat */}
              <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{data.upcomingSessions}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Upcoming Sessions</h3>
              </motion.div>

              {/* Total Bookings Stat */}
              <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{data.totalBookings}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              </motion.div>

              {/* Average Capacity Stat */}
              <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{data.averageCapacity}%</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Avg Capacity</h3>
              </motion.div>
            </div>

            {/* Next Session Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
            >
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold opacity-90">Next Session</h2>
                    {data.nextSession ? (
                      <div className="mt-4">
                        <div className="text-3xl font-bold mb-1">{data.nextSession.class_type}</div>
                        <div className="flex items-center gap-2 opacity-90">
                          <Users className="w-4 h-4" />
                          <span>{data.nextSession.current_bookings}/{data.nextSession.max_members} members booked</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="text-2xl font-bold">No upcoming sessions</div>
                        <p className="opacity-80 mt-1">Create your next session to get started</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-indigo-500/50 flex items-center justify-between">
                  {data.nextSession ? (
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{data.nextSession.start_time} - {data.nextSession.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {new Date(data.nextSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                     <button className="text-sm font-medium hover:text-indigo-100 transition-colors">
                        Create Session &rarr;
                     </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Sessions with Bookings */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-gray-900">Recent Booked Sessions</h2>
                 <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All</button>
               </div>
               
               <div className="space-y-4">
                 {data.recentSessions.length > 0 ? (
                   data.recentSessions.map((session) => (
                     <div key={session.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                       <div className="flex items-center gap-4">
                         <div className="bg-indigo-100 p-2 rounded-lg">
                           <Dumbbell className="w-5 h-5 text-indigo-600" />
                         </div>
                         <div>
                           <div className="font-medium text-gray-900">{session.class_type}</div>
                           <div className="text-xs text-gray-500">
                             {new Date(session.date).toLocaleDateString()} • {session.start_time}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-gray-900">{session.current_bookings}/{session.max_members}</div>
                         <div className="text-xs text-gray-500">members</div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-500">No recent bookings found</div>
                 )}
               </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            
            {/* Revenue Card */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Total Revenue</h2>
              
              <div className="text-center py-4">
                <div className="text-4xl font-black text-indigo-600 mb-2">
                  ${data.totalRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">From all bookings</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Sessions</span>
                  <span className="font-bold text-gray-900">{data.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-500">Class Types</span>
                  <span className="font-bold text-gray-900">{data.classTypes.length}</span>
                </div>
              </div>
            </motion.div>

            {/* Most Popular Class */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Most Popular</h2>
              
              {data.popularClass ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-100 p-3 rounded-xl">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{data.popularClass.name}</div>
                      <div className="text-sm text-gray-500">{data.popularClass.bookings} total bookings</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-600">
                      This is your most booked class type. Keep up the great work!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No bookings yet</p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                     <Link to="/trainer/dashboard/my-classes"> Create Session</Link>
                    </span>
                  </div> 
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                      <Link to="/trainer/dashboard/schedule">View Schedule</Link>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <User2 className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                     <Link to="/trainer/dashboard/profile">Update Profile</Link>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>
              </div>
            </motion.div>

            {/* Motivational Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white text-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Keep Growing!</h3>
                <p className="text-gray-300 text-sm mb-4">
                  {data.averageCapacity >= 75 
                    ? "Your sessions are thriving! Consider adding more slots."
                    : "Boost your bookings by promoting your upcoming sessions."}
                </p>
                <div className="flex justify-center gap-2">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                    {data.averageCapacity}% capacity
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full filter blur-3xl opacity-20 transform translate-y-10 -translate-x-10"></div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Calendar, CreditCard, ShoppingBag, TrendingUp, Clock, User, 
  ChevronRight, Dumbbell
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    membership: null,
    nextSession: null,
    totalSpent: 0,
    activeBookingsCount: 0,
    cartItemCount: 0,
    recentOrders: []
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API;
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

      const [membershipRes, bookingsRes, ordersRes, prodCartRes, sessionCartRes] = await Promise.all([
        fetch(`${API_URL}/membership/current`, { headers }), 
        fetch(`${API_URL}/checkout/bookings?status=confirmed`, { headers }), 
        fetch(`${API_URL}/checkout/orders`, { headers }), 
        fetch(`${API_URL}/cart/cart`, { headers }), 
        fetch(`${API_URL}/session-cart/`, { headers })
      ]);

      const membershipData = await membershipRes.json();
      const bookingsData = await bookingsRes.json();
      const ordersData = await ordersRes.json();
      const prodCartData = await prodCartRes.json();
      const sessionCartData = await sessionCartRes.json();

      const now = new Date();
      const upcomingSessions = bookingsData.bookings?.filter(b => {
        const sessionDate = new Date(`${b.date}T${b.start_time}`);
        return sessionDate > now;
      }).sort((a, b) => new Date(`${a.date}T${a.start_time}`) - new Date(`${b.date}T${b.start_time}`));

      const totalOrderSpend = ordersData.orders?.reduce((acc, order) => acc + order.total_price, 0) || 0;
      
      const totalCartItems = (prodCartData.total_items || 0) + (sessionCartData.total_items || 0);

      setData({
        membership: membershipData.membership || null,
        nextSession: upcomingSessions?.[0] || null,
        activeBookingsCount: upcomingSessions?.length || 0,
        totalSpent: totalOrderSpend,
        cartItemCount: totalCartItems,
        recentOrders: ordersData.orders?.slice(0, 3) || [] // Show last 3 orders
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
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-1">Here is your training overview for today.</p>
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
                  <span className="text-2xl font-bold text-gray-900">{data.activeBookingsCount}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Upcoming Sessions</h3>
              </motion.div>

              {/* Cart Items Stat */}
              <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{data.cartItemCount}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Items in Cart</h3>
              </motion.div>

              {/* Total Spent Stat */}
              <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">${data.totalSpent.toFixed(0)}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
              </motion.div>
            </div>

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
                          <User className="w-4 h-4" />
                          <span>With {data.nextSession.trainer_name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="text-2xl font-bold">No sessions booked</div>
                        <p className="opacity-80 mt-1">Ready to start sweating?</p>
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
                        Browse Schedule &rarr;
                     </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Order History */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                 <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All</button>
               </div>
               
               <div className="space-y-4">
                 {data.recentOrders.length > 0 ? (
                   data.recentOrders.map((order) => (
                     <div key={order.order_id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                       <div className="flex items-center gap-4">
                         <div className="bg-gray-100 p-2 rounded-lg">
                           <ShoppingBag className="w-5 h-5 text-gray-600" />
                         </div>
                         <div>
                           <div className="font-medium text-gray-900">Order #{order.order_id}</div>
                           <div className="text-xs text-gray-500">{order.items_count} items • {new Date(order.created_at).toLocaleDateString()}</div>
                         </div>
                       </div>
                       <span className="font-bold text-gray-900">${order.total_price.toFixed(2)}</span>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-500">No recent orders found</div>
                 )}
               </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            
            {/* Membership Status Card */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Membership</h2>
              
              {data.membership ? (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-gray-500">Plan</span>
                    <span className="font-bold text-indigo-600">{data.membership.type}</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                    <div 
                      className={`h-2.5 rounded-full ${data.membership.days_remaining < 7 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((data.membership.days_remaining / 30) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-6">
                    <span>Active</span>
                    <span className={data.membership.days_remaining < 7 ? 'text-red-600 font-medium' : ''}>
                      {data.membership.days_remaining} days left
                    </span>
                  </div>

                  <button 
                    className="w-full py-2.5 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                    onClick={() => window.location.href = '/member/dashboard/my-membership'}
                  >
                    Manage Membership
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Active Plan</h3>
                  <p className="text-sm text-gray-500 mb-4">Get unlimited access to facilities</p>
                  <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    View Plans
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                     <Link to="/member/dashboard/classes">Book a Class</Link>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                      <Link to="/member/dashboard/products">Browse Store</Link>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all group">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                    <span className="font-medium text-sm">
                      <Link to="/member/dashboard/bookings">Manage Bookings</Link>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
                </button>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white text-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Need a Boost?</h3>
                <p className="text-gray-300 text-sm mb-4">Check out our new protein supplements in the store.</p>
                <button 
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
                  onClick={() => window.location.href = '/member/dashboard/products'}
                >
                  Shop Now
                </button>
              </div>
              {/* Background accent */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full filter blur-3xl opacity-20 transform translate-y-10 -translate-x-10"></div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
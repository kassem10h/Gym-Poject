import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, DollarSign, ShoppingBag, Calendar, 
  AlertTriangle, TrendingUp, Package, ArrowRight,
  UserPlus, FileText, Settings, Dumbbell
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

const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardSnapshot();
  }, []);

  const fetchDashboardSnapshot = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics/dashboard?days=30`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const jsonData = await res.json();
        setData(jsonData);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback if data fails
  if (!data) return <div className="p-8">Failed to load dashboard data.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">Admin Overview</h1>
            <p className="text-zinc-500 font-medium">Snapshot for the last 30 days.</p>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/admin/dashboard/analytics" 
              className="px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-colors"
            >
              View Full Analytics
            </Link>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* --- Left Column: Key Performance Indicators --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Revenue Hero Card */}
            <motion.div 
              variants={itemVariants}
              className="bg-zinc-900 rounded-[28px] p-8 text-white relative overflow-hidden shadow-xl"
            >
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-zinc-400">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Total Revenue (30d)</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2">
                    ${data.revenue.recent.toLocaleString()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${data.revenue.growth_percentage >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {data.revenue.growth_percentage > 0 ? '+' : ''}{data.revenue.growth_percentage}%
                    </span>
                    <span className="text-zinc-500 text-sm">vs previous period</span>
                  </div>
                </div>
                
                <div className="bg-zinc-800 p-4 rounded-2xl w-full md:w-auto min-w-[200px] border border-zinc-700">
                  <p className="text-[10px] text-zinc-400 uppercase font-black mb-1">Breakdown</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-zinc-300">Bookings</span>
                    <span className="text-sm font-bold">${data.revenue.booking_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300">Store Orders</span>
                    <span className="text-sm font-bold">${(data.revenue.recent - data.revenue.booking_revenue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-zinc-800 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard 
                label="Total Users" 
                value={data.users.total} 
                subValue={`+${data.users.new_users} new`}
                icon={Users} 
                trend="up"
              />
              <StatCard 
                label="Orders Processed" 
                value={data.orders.recent}
                subValue={`$${data.orders.avg_value.toFixed(0)} avg value`}
                icon={ShoppingBag}
                trend="neutral"
              />
              <StatCard 
                label="Active Bookings" 
                value={data.bookings.recent}
                subValue={`${data.bookings.cancellation_rate}% cancel rate`}
                icon={Calendar}
                trend="down" // High cancellation is bad
              />
              <StatCard 
                label="Inventory Count" 
                value={data.inventory.products + data.inventory.equipment}
                subValue={`${data.inventory.products_sold} sold recently`}
                icon={Package}
                trend="neutral"
              />
            </div>
          </div>

          {/* --- Right Column: Action & Alerts --- */}
          <div className="space-y-6">
            
            {/* Attention Needed / Alerts */}
            <motion.div variants={itemVariants} className="bg-white rounded-[28px] p-6 border border-zinc-200 shadow-sm">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Attention Needed
              </h3>
              
              <div className="space-y-3">
                {data.memberships.expiring_soon > 0 ? (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-orange-100 transition-colors">
                    <div>
                      <p className="text-2xl font-black text-orange-600">{data.memberships.expiring_soon}</p>
                      <p className="text-xs font-bold text-orange-800">Memberships Expiring</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 rounded-2xl text-center text-xs text-zinc-400 font-bold">
                    No membership alerts
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-blue-100 transition-colors">
                   <div>
                      <p className="text-2xl font-black text-blue-600">{data.users.active_members}</p>
                      <p className="text-xs font-bold text-blue-800">Active Members</p>
                    </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Menu */}
            <motion.div variants={itemVariants} className="bg-white rounded-[28px] p-6 border border-zinc-200 shadow-sm">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <QuickActionLink 
                  to="/admin/dashboard/trainer-management" 
                  icon={UserPlus} 
                  label="Approve Trainers" 
                  desc="Manage staff access"
                />
                <QuickActionLink 
                  to="/admin/dashboard/product-manager" 
                  icon={Package} 
                  label="Update Products" 
                  desc="Add or edit products"
                />
                <QuickActionLink 
                  to="/admin/dashboard/equipment-manager" 
                  icon={Dumbbell} 
                  label="Update Equipments" 
                  desc="Add or edit equipments"
                />
                 <QuickActionLink 
                  to="/admin/dashboard/orders" 
                  icon={FileText} 
                  label="View Orders" 
                  desc="Manage customer orders"
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ label, value, subValue, icon: Icon, trend }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white p-6 rounded-[24px] border border-zinc-100 shadow-sm hover:border-zinc-300 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-zinc-50 rounded-xl text-zinc-900">
          <Icon className="w-5 h-5" />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
      </div>
      <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">{value.toLocaleString()}</h3>
      <div className="mt-1 flex flex-col">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{label}</span>
        <span className="text-[10px] font-bold text-zinc-500 mt-1">{subValue}</span>
      </div>
    </motion.div>
  );
}

function QuickActionLink({ to, icon: Icon, label, desc }) {
  return (
    <Link 
      to={to}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-all group border border-transparent hover:border-zinc-100"
    >
      <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-zinc-900">{label}</h4>
        <p className="text-[10px] font-medium text-zinc-400">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-300 ml-auto group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, Calendar, DollarSign, 
  ChevronLeft, ChevronRight, X, Eye, TrendingUp, 
  Package, Download, ArrowUpRight, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// --- Configuration & Helpers ---
const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

const formatCurrency = (val) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD'
}).format(val);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminOrdersDashboard() {
  // --- State ---
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Details
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // --- API Calls ---
  
  const fetchAnalytics = async () => {
    try {
      const [overviewRes, chartRes] = await Promise.all([
        fetch(`${API_URL}/orders/analytics/overview?days=30`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_URL}/orders/analytics/revenue-chart?period=daily&days=7`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);
      
      if (overviewRes.ok) setAnalytics(await overviewRes.json());
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        setChartData(chartJson.data);
      }
    } catch (e) { console.error("Analytics Error", e); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: 10,
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end }),
        ...(searchTerm && { user_id: searchTerm }) // Simple ID search for now
      });

      const res = await fetch(`${API_URL}/orders/?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (e) { console.error("Order Fetch Error", e); }
    finally { setLoading(false); }
  };

  const fetchSingleOrder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setOrderDetails(await res.json());
        setShowModal(true);
      }
    } catch (e) { console.error("Detail Error", e); }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, dateRange]);

  // --- UI Components ---

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20">
      
      {/* Header */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-zinc-900">Order Management</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Commerce Intelligence Dashboard</p>
            </div>
            <div className="flex gap-3">
            </div>
          </div>

          {/* Stats Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
              <StatCard label="Total Revenue" value={formatCurrency(analytics.overview.total_revenue)} icon={DollarSign} trend="+12.5%" />
              <StatCard label="Monthly Orders" value={analytics.overview.recent_orders} icon={ShoppingBag} />
              <StatCard label="Avg. Order Value" value={formatCurrency(analytics.overview.avg_order_value)} icon={TrendingUp} />
              <StatCard label="Active Customers" value={analytics.top_customers.length} icon={User} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-400">Revenue Performance (7 Days)</h3>
              <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">
                <ArrowUpRight className="w-3 h-3" /> Growth Stable
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
               <h3 className="font-black text-sm uppercase tracking-wider text-zinc-500 mb-6">Top Selling Products</h3>
               <div className="space-y-4">
                 {analytics?.top_products.map((prod, idx) => (
                   <div key={prod.product_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-700">{idx + 1}</span>
                        <div className="text-sm font-bold truncate max-w-[120px]">{prod.product_name}</div>
                      </div>
                      <div className="text-xs font-black text-zinc-400">{prod.total_quantity} sold</div>
                   </div>
                 ))}
               </div>
            </div>
            <Package className="absolute -bottom-6 -right-6 w-32 h-32 text-zinc-800/50 rotate-12" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Filter by Order ID or User ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <input 
               type="date" 
               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
               className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
             />
             <input 
               type="date" 
               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
               className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
             />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-bold text-sm text-zinc-900">#{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold">{order.user_name}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">{order.user_email}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {formatDate(order.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-sm">{formatCurrency(order.total_price)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => fetchSingleOrder(order.id)}
                      className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-900 hover:text-white transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="mt-6 flex justify-between items-center px-2">
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
               Page {pagination.page} of {pagination.pages}
             </span>
             <div className="flex gap-2">
                <button 
                  disabled={!pagination.has_prev}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 bg-white border border-zinc-200 rounded-xl disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={!pagination.has_next}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 bg-white border border-zinc-200 rounded-xl disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}
      </div>

      {/* --- Order Details Modal --- */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Order Details #${orderDetails?.id}`}>
        {orderDetails && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
               <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Customer</p>
                  <p className="text-sm font-bold">{orderDetails.user.name}</p>
                  <p className="text-xs text-zinc-500">{orderDetails.user.email}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-sm font-bold">{orderDetails.user.phone || 'N/A'}</p>
               </div>
            </div>

            <div>
               <h4 className="text-xs font-black uppercase text-zinc-900 mb-4 flex items-center gap-2">
                 <Package className="w-4 h-4" /> Line Items ({orderDetails.items.length})
               </h4>
               <div className="space-y-3">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border border-zinc-100 rounded-xl">
                       <div className="flex-1">
                          <p className="text-sm font-bold text-zinc-900">{item.product_name}</p>
                          <p className="text-xs text-zinc-500">Qty: {item.quantity} × {formatCurrency(item.price_at_purchase)}</p>
                       </div>
                       <p className="font-black text-sm">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex justify-between items-end">
               <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Order Created</p>
                  <p className="text-sm font-bold">{formatDate(orderDetails.created_at)}</p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Grand Total</p>
                  <p className="text-2xl font-black text-zinc-900">{formatCurrency(orderDetails.total_price)}</p>
               </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

// --- Helper Sub-components ---

function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="p-5 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-zinc-900 group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        {trend && <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black text-zinc-900 mt-1">{value}</h4>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
             <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                   <h2 className="text-xl font-black text-zinc-900 tracking-tighter">{title}</h2>
                   <button onClick={onClose} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                   </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                   {children}
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
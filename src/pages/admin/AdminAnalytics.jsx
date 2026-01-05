import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, 
  DollarSign, Calendar, Package, Download, RefreshCw,
  Layers, CheckCircle2, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// --- Configuration ---
const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// --- Reusable Layout Components ---
const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">{title}</h3>
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

// --- Loading Skeletons ---
const SkeletonCard = () => (
  <div className="p-6 rounded-[28px] bg-zinc-50 border border-zinc-100 animate-pulse h-[140px]">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 bg-zinc-200 rounded-xl" />
      <div className="w-16 h-6 bg-zinc-200 rounded-lg" />
    </div>
    <div className="w-24 h-3 bg-zinc-200 rounded mb-2" />
    <div className="w-32 h-8 bg-zinc-200 rounded" />
  </div>
);

const ChartSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-zinc-50/50 rounded-2xl animate-pulse">
    <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-6 mt-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex justify-between items-center animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-zinc-800 rounded" />
          <div>
            <div className="w-24 h-4 bg-zinc-800 rounded mb-1" />
            <div className="w-12 h-3 bg-zinc-800 rounded opacity-50" />
          </div>
        </div>
        <div className="w-16 h-8 bg-zinc-800 rounded" />
      </div>
    ))}
  </div>
);

export default function AdminAnalytics() {
  // --- Granular Data States ---
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  // --- Granular Loading States ---
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [timeRange, setTimeRange] = useState(30);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // --- Data Fetching (Split for independent loading) ---
  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch(`${API_URL}/analytics/dashboard?days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setDashboardData(await res.json());
    } catch (err) { console.error("Dashboard Error:", err); } 
    finally { setLoadingDashboard(false); }
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    try {
      const res = await fetch(`${API_URL}/analytics/revenue/trends?period=daily&days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRevenueTrends(data.data);
      }
    } catch (err) { console.error("Trends Error:", err); } 
    finally { setLoadingTrends(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/analytics/products/top-performers?limit=5`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopProducts(data.top_by_revenue);
      }
    } catch (err) { console.error("Products Error:", err); } 
    finally { setLoadingProducts(false); }
  };

  const fetchAllData = () => {
    // Trigger all fetches in parallel, but handle state independently
    fetchDashboard();
    fetchTrends();
    fetchProducts();
  };

  // --- Export Handler ---
  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_URL}/analytics/export/csv?type=${type}&days=${timeRange}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export Error:", err);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [timeRange]);

  // Combined loading state for the refresh button animation only
  const isGlobalLoading = loadingDashboard || loadingTrends || loadingProducts;

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 font-sans">
      {/* --- Top Navigation / Control Bar --- */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tighter">Analytics</h1>
          <div className="h-4 w-[1px] bg-zinc-200 hidden md:block" />
          <div className="hidden md:flex gap-1 bg-zinc-50 p-1 rounded-xl">
            {[7, 30, 90].map((d) => (
              <button 
                key={d} onClick={() => setTimeRange(d)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  timeRange === d ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchAllData}
            disabled={isGlobalLoading}
            className="p-2.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGlobalLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => !isExporting && setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:bg-zinc-600 cursor-pointer disabled:cursor-wait"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            
            {showExportMenu && !isExporting && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-black text-zinc-400 uppercase px-3 py-2">Export as CSV</div>
                {[
                  { id: 'dashboard', label: 'Dashboard Overview' },
                  { id: 'revenue_trends', label: 'Revenue Trends' },
                  { id: 'top_products', label: 'Top Products' },
                  { id: 'customers', label: 'Customer Insights' },
                  { id: 'trainers', label: 'Trainer Performance' },
                  { id: 'bookings', label: 'Booking Analysis' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleExport(option.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loadingDashboard ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <KPICard 
                label="Total Revenue" 
                value={`$${dashboardData?.revenue.recent.toLocaleString()}`}
                growth={dashboardData?.revenue.growth_percentage}
                icon={DollarSign}
                accent="bg-zinc-900 text-white"
              />
              <KPICard 
                label="Orders Fulfilled" 
                value={dashboardData?.orders.recent}
                growth={dashboardData?.orders.growth_percentage}
                icon={ShoppingBag}
              />
              <KPICard 
                label="Booking Success" 
                value={`${dashboardData?.bookings.confirmed}`}
                subtitle={`${dashboardData?.bookings.cancellation_rate}% Cancel Rate`}
                icon={Calendar}
              />
              <KPICard 
                label="New Acquisition" 
                value={dashboardData?.users.new_users}
                subtitle={`${dashboardData?.users.total} Total Users`}
                icon={Users}
              />
            </>
          )}
        </div>

        {/* --- Main Analytics Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Revenue & Growth Trend */}
          <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-[32px] p-8 shadow-sm">
            <SectionHeader title="Financial Performance" subtitle="Orders vs Bookings Revenue" icon={TrendingUp} />
            <div className="h-[350px] w-full mt-4">
              {loadingTrends ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrends}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 10, fontWeight: 700, fill: '#a1a1aa'}} 
                      axisLine={false} tickLine={false} 
                      tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{fontSize: 10, fontWeight: 700, fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" dataKey="order_revenue" name="Products" 
                      stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#orderGrad)" 
                    />
                    <Area 
                      type="monotone" dataKey="booking_revenue" name="Bookings"
                      stroke="#71717a" strokeWidth={3} strokeDasharray="5 5" fill="none" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right Column: Top Products */}
          <div className="space-y-8">
             <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden h-full">
                <SectionHeader title="Top Products" subtitle="By Revenue Share" icon={Package} />
                
                {loadingProducts ? (
                  <ListSkeleton />
                ) : (
                  <div className="space-y-6 mt-6 relative z-10">
                    {topProducts.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-700 w-4">{idx + 1}</span>
                          <div>
                            <p className="text-sm font-bold">{product.product_name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">${product.revenue.toLocaleString()}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">{product.quantity_sold} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Layers className="absolute -bottom-10 -right-10 w-40 h-40 text-zinc-800/40 rotate-12" />
             </div>
          </div>
        </div>

        {/* --- Bottom Row: Membership & Inventory --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-8">
              <SectionHeader title="Membership Overview" subtitle="Active vs Expiring" icon={Layers} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="bg-white p-6 rounded-2xl border border-zinc-200 relative overflow-hidden">
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Active Now</p>
                    {loadingDashboard ? (
                      <div className="h-9 w-20 bg-zinc-100 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-3xl font-black text-zinc-900">{dashboardData?.memberships.active}</p>
                    )}
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-zinc-200">
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Expiring Soon</p>
                    {loadingDashboard ? (
                      <div className="h-9 w-20 bg-zinc-100 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-3xl font-black text-red-600">{dashboardData?.memberships.expiring_soon}</p>
                    )}
                 </div>
              </div>
           </div>

           <div className="bg-white border border-zinc-200 rounded-[32px] p-8">
              <SectionHeader title="Inventory Overview" subtitle="Products vs Equipment" icon={CheckCircle2} />
              <div className="h-48 w-full">
                {loadingDashboard ? (
                  <ChartSkeleton />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Products', value: dashboardData?.inventory.products },
                      { name: 'Equipment', value: dashboardData?.inventory.equipment }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        <Cell fill="#18181b" />
                        <Cell fill="#a1a1aa" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Internal Helper Components ---

function KPICard({ label, value, growth, subtitle, icon: Icon, accent = "bg-white border border-zinc-100 shadow-sm" }) {
  const isPositive = growth > 0;
  return (
    <div className={`p-6 rounded-[28px] ${accent} transition-transform hover:scale-[1.02] cursor-default`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${accent.includes('bg-zinc-900') ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {growth !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
            isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest ${accent.includes('bg-zinc-900') ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {label}
      </p>
      <h4 className="text-3xl font-black mt-1 tracking-tighter">{value}</h4>
      {subtitle && <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase">{subtitle}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 shadow-2xl rounded-2xl border border-zinc-100 min-w-[150px]">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-50 pb-2">
          {new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, i) => (
            <div key={i} className="flex justify-between items-center gap-4">
              <span className="text-xs font-bold text-zinc-500">{entry.name}:</span>
              <span className="text-sm font-black text-zinc-900">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
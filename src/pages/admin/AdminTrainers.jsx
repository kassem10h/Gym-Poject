import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CheckCircle, XCircle, Trash2, 
  Search, Filter, ExternalLink, MoreVertical,
  ShieldCheck, ShieldAlert, UserPlus, Info
} from 'lucide-react';

// --- Configuration ---
const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export default function AdminTrainerManagement() {
  const [trainers, setTrainers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // --- Fetch Stats ---
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/trainers/stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Stats Fetch Error:", err);
    }
  };

  // --- Fetch Trainers ---
  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/admin/trainers/?status=${filterStatus}&page=${page}&limit=10`, 
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTrainers(data.trainers);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Trainers Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, page]);

  // --- Actions ---
  const handleToggleStatus = async (userId, isActive) => {
    const action = isActive ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`${API_URL}/admin/trainers/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchTrainers();
        fetchStats();
      } else {
        const errorData = await res.json();
        alert(errorData.error || `Failed to ${action} trainer`);
      }
    } catch (err) {
      console.error("Action Error:", err);
    }
  };

  const handleDeleteTrainer = async (userId) => {
    if (!window.confirm("Are you sure? This action is permanent and deletes the profile.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/trainers/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchTrainers();
        fetchStats();
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTrainers();
  }, [fetchTrainers]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 font-sans">
      {/* --- Header Section --- */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Trainer Management</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verify and Monitor Professional Staff</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold w-full md:w-64 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-zinc-900 text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl cursor-pointer outline-none hover:bg-zinc-800 transition-colors"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Pending/Inactive</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* --- Quick Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Pool" value={stats?.total_trainers || 0} icon={Users} color="text-zinc-900" />
          <StatCard label="Active Staff" value={stats?.active_trainers || 0} icon={ShieldCheck} color="text-green-600" />
          <StatCard label="Pending Approval" value={stats?.inactive_trainers || 0} icon={ShieldAlert} color="text-orange-500" />
          <StatCard label="Profiles Incomplete" value={stats?.trainers_without_profiles || 0} icon={Info} color="text-red-500" />
        </div>

        {/* --- Management Table --- */}
        <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trainer Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Specialization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rate</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trainers.filter(t => 
                  `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((trainer) => (
                  <tr key={trainer.user_id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0">
                          {trainer.profile?.profile_picture_url ? (
                            <img src={trainer.profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                              {trainer.first_name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900">{trainer.first_name} {trainer.last_name}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{trainer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {trainer.profile ? (
                        <div>
                          <p className="text-xs font-bold text-zinc-700">{trainer.profile.specialization}</p>
                          <p className="text-[10px] text-zinc-400 uppercase font-black">{trainer.profile.years_of_experience} Years Exp</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-red-400 uppercase italic">No Profile Data</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black">${trainer.profile?.hourly_rate || '0'}/hr</p>
                    </td>
                    <td className="px-6 py-4">
                      {trainer.is_active ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase">
                          <CheckCircle className="w-3 h-3" /> Active
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase">
                          <XCircle className="w-3 h-3" /> Inactive
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(trainer.user_id, trainer.is_active)}
                          disabled={!trainer.has_profile && !trainer.is_active}
                          className={`p-2 rounded-xl transition-all border ${
                            trainer.is_active 
                              ? 'border-zinc-200 hover:bg-zinc-900 hover:text-white' 
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                          } disabled:opacity-30 disabled:cursor-not-allowed`}
                          title={trainer.is_active ? "Deactivate" : "Approve/Activate"}
                        >
                          {trainer.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteTrainer(trainer.user_id)}
                          className="p-2 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination --- */}
          <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Showing Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={!pagination.has_prev}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase hover:bg-zinc-100 disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button 
                disabled={!pagination.has_next}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Internal Stat Card Component ---
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-zinc-100 p-6 rounded-[28px] shadow-sm hover:scale-[1.02] transition-transform">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-zinc-50 rounded-xl">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-black tracking-tighter mt-1">{value}</h3>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Eye, EyeOff, Mail, Phone, User,
  Calendar, Shield, Activity, UserCheck, UserX, 
  ChevronLeft, ChevronRight, X, Briefcase, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Helpers ---
const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

const getAvatar = (name) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=18181b&color=fff&bold=true`;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminUsersPage() {
  // --- State ---
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Notification
  const [notification, setNotification] = useState(null);

  // --- API Interactions ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error("Stats error", e); }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        per_page: 12,
        search: searchTerm,
        ...(roleFilter && { role: roleFilter })
      });

      const res = await fetch(`${API_URL}/admin/users/?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        showNotification('Failed to load users', 'error');
      }
    } catch (error) {
      showNotification('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchUsers(); }, [page, roleFilter, searchTerm]); 

  const handleStatusToggle = async (userId, currentStatus, e) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      const endpoint = currentStatus ? 'deactivate' : 'activate';
      const res = await fetch(`${API_URL}/admin/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (res.ok) {
        showNotification(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
        fetchStats();
      } else {
        showNotification('Action failed', 'error');
      }
    } catch (e) {
      showNotification('Error updating status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (formData) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${editingUser.user_id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showNotification('User updated successfully');
        setShowEditModal(false);
        fetchUsers();
      } else {
        showNotification('Update failed', 'error');
      }
    } catch (e) {
      showNotification('Error updating user', 'error');
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      const [userRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users/${userId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } }),
        fetch(`${API_URL}/admin/users/${userId}/bookings`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };
        
        setSelectedUser({ ...userData, bookings: bookingsData.bookings });
        setShowDetailModal(true);
      }
    } catch (e) {
      showNotification('Failed to load details', 'error');
    }
  };
  
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-md shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-red-600 text-white border-red-700'
            }`}
          >
            <span className="font-medium text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Stats */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">User Management</h1>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Admin Dashboard</p>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.total_users} icon={Users} />
              <StatCard label="Active Members" value={stats.active_memberships} icon={Activity} />
              <StatCard label="Trainers" value={stats.total_trainers} icon={Briefcase} />
              <StatCard label="Total Bookings" value={stats.total_bookings} icon={Calendar} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zinc-900 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Member', 'Trainer', 'Admin'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === 'All' ? '' : role)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                  (role === 'All' && !roleFilter) || roleFilter === role
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* User Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <>
            <motion.div 
              variants={containerVariants} initial="hidden" animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {users.map(user => (
                <UserCard 
                  key={user.user_id} 
                  user={user} 
                  onToggleStatus={(e) => handleStatusToggle(user.user_id, user.is_active, e)}
                  onEdit={() => { setEditingUser(user); setShowEditModal(true); }}
                  onView={() => loadUserDetails(user.user_id)}
                />
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {pagination && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-100">
                <span className="text-xs font-medium text-zinc-500">
                  Showing page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        {editingUser && <EditUserForm user={editingUser} onSubmit={handleUpdateUser} onCancel={() => setShowEditModal(false)} />}
      </Modal>

      {/* Detailed View Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="User Profile">
         {selectedUser && <UserDetailView user={selectedUser} />}
      </Modal>

    </div>
  );
}

// --- Sub-Components ---

function StatCard({ label, value, icon: Icon, highlight = false }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-zinc-400' : 'text-zinc-300'}`} />
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function UserCard({ user, onToggleStatus, onEdit, onView }) {
  const fullName = `${user.first_name} ${user.last_name}`;
  
  return (
    <motion.div 
      variants={itemVariants}
      onClick={onView}
      className="group bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-xl hover:border-zinc-300 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <img src={getAvatar(fullName)} alt={fullName} className="w-12 h-12 rounded-full border-2 border-zinc-100" />
          <div>
            <h3 className="font-bold text-zinc-900">{fullName}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
              user.role === 'Trainer' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
              user.role === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Mail className="w-3.5 h-3.5" /> {user.email}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Phone className="w-3.5 h-3.5" /> {user.phone || 'No phone'}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-zinc-50">
         <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 py-2 text-xs font-bold uppercase bg-zinc-50 hover:bg-zinc-100 rounded text-zinc-700 transition-colors">
            Edit
         </button>
         <button 
           onClick={onToggleStatus}
           className={`px-3 py-2 rounded text-xs font-bold uppercase transition-colors ${
             user.is_active 
               ? 'bg-red-50 text-red-600 hover:bg-red-100' 
               : 'bg-green-50 text-green-600 hover:bg-green-100'
           }`}
         >
           {user.is_active ? <UserX className="w-4 h-4"/> : <UserCheck className="w-4 h-4"/>}
         </button>
      </div>
    </motion.div>
  );
}

function EditUserForm({ user, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    phone: user.phone || '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    const dataToSend = { ...formData };
    
    if (!dataToSend.password || dataToSend.password.trim() === '') {
      delete dataToSend.password;
    }
    
    onSubmit(dataToSend);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
            <User className="w-3 h-3" />
            First Name
          </label>
          <input 
            value={formData.first_name} 
            onChange={e => setFormData({...formData, first_name: e.target.value})}
            className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
            <User className="w-3 h-3" />
            Last Name
          </label>
          <input 
            value={formData.last_name} 
            onChange={e => setFormData({...formData, last_name: e.target.value})}
            className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
          <Phone className="w-3 h-3" />
          Phone
        </label>
        <input 
          value={formData.phone} 
          onChange={e => setFormData({...formData, phone: e.target.value})}
          className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-colors"
          placeholder="Enter phone number"
        />
      </div>

      {/* Current Password Display */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5 mb-2">
          <Lock className="w-3 h-3" />
          Current Password
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-sm text-zinc-400">
            ••••••••••••
          </div>
          <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded font-bold uppercase">
            Hidden
          </span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">
          For security, current password cannot be displayed
        </p>
      </div>

      {/* New Password Input with Toggle */}
      <div>
        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          New Password (Optional)
        </label>
        <div className="relative mt-1">
          <input 
            type={showPassword ? "text" : "password"}
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="Leave blank to keep current password"
            className="w-full p-2 pr-10 bg-zinc-50 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-zinc-400" />
            ) : (
              <Eye className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Leave blank to keep the current password. Minimum 6 characters if changing.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Role
        </label>
        <select 
          value={formData.role} 
          onChange={e => setFormData({...formData, role: e.target.value})}
          className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded text-sm outline-none focus:border-zinc-900 transition-colors"
        >
          <option value="Member">Member</option>
          <option value="Trainer">Trainer</option>
          <option value="Admin">Admin</option>
        </select>
        <p className="text-[10px] text-zinc-400 mt-1">
          Changing role to "Trainer" may require filling additional profile details later.
        </p>
      </div>

      <div className="flex gap-3 pt-4 border-t border-zinc-100 mt-6">
        <button 
          onClick={onCancel} 
          className="flex-1 py-2.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit} 
          className="flex-1 py-2.5 bg-zinc-900 text-white rounded text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

function UserDetailView({ user }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      {/* Header Profile */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
        <img src={getAvatar(user.first_name + ' ' + user.last_name)} className="w-16 h-16 rounded-full" />
        <div>
          <h2 className="text-xl font-black text-zinc-900">{user.first_name} {user.last_name}</h2>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-bold uppercase">{user.role}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 mb-4">
        {['Overview', 'Bookings', ...(user.role === 'Trainer' ? ['Trainer Info'] : [])].map(tab => {
          const key = tab.toLowerCase().replace(' ', '_');
          return (
            <button 
              key={key} 
              onClick={() => setActiveTab(key)}
              className={`pb-2 text-sm font-bold transition-colors ${
                activeTab === key ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <InfoItem label="Email" value={user.email} icon={Mail} />
               <InfoItem label="Phone" value={user.phone} icon={Phone} />
               <InfoItem label="Gender" value={user.gender} icon={Users} />
               <InfoItem label="DOB" value={user.date_of_birth} icon={Calendar} />
            </div>
            
            {user.membership && (
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mt-4">
                <h4 className="text-xs font-black uppercase text-zinc-400 mb-3">Active Membership</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-zinc-900">{user.membership.type}</div>
                    <div className="text-xs text-zinc-500">Expires: {formatDate(user.membership.end_date)}</div>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {user.bookings && user.bookings.length > 0 ? user.bookings.map(booking => (
              <div key={booking.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-lg hover:border-zinc-300 transition-colors">
                 <div>
                    <div className="text-sm font-bold text-zinc-800">
                      {booking.session_details?.date ? formatDate(booking.session_details.date) : 'Unknown Date'}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {booking.session_details?.start_time} - {booking.session_details?.end_time}
                    </div>
                 </div>
                 <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                   booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-500'
                 }`}>
                   {booking.status}
                 </span>
              </div>
            )) : (
              <p className="text-center text-zinc-400 text-sm py-4">No booking history.</p>
            )}
          </div>
        )}

        {activeTab === 'trainer_info' && user.trainer_info && (
          <div className="space-y-4">
             <div className="flex gap-4">
                <img src={user.trainer_info.profile_picture_url || getAvatar('Trainer')} className="w-20 h-20 rounded-lg object-cover bg-zinc-100" />
                <div className="flex-1">
                   <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-zinc-50 p-2 rounded">
                        <div className="text-[10px] uppercase text-zinc-400 font-bold">Hourly Rate</div>
                        <div className="font-bold">${user.trainer_info.hourly_rate || '0.00'}</div>
                      </div>
                      <div className="bg-zinc-50 p-2 rounded">
                        <div className="text-[10px] uppercase text-zinc-400 font-bold">Experience</div>
                        <div className="font-bold">{user.trainer_info.years_of_experience} Years</div>
                      </div>
                   </div>
                </div>
             </div>
             <div>
                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Specialization</div>
                <p className="text-sm text-zinc-800">{user.trainer_info.specialization}</p>
             </div>
             <div>
                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Bio</div>
                <p className="text-sm text-zinc-600 leading-relaxed">{user.trainer_info.bio || 'No bio provided.'}</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-zinc-400" />
        <span className="text-[10px] font-bold uppercase text-zinc-500">{label}</span>
      </div>
      <div className="text-sm font-medium text-zinc-900 truncate">{value || 'N/A'}</div>
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
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                   <h2 className="text-lg font-black text-zinc-900 tracking-tight">{title}</h2>
                   <button onClick={onClose} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                      <X className="w-4 h-4 text-zinc-500" />
                   </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                   {children}
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Edit3, Save, X, 
  ShieldCheck, Loader2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

function Toast({ notification }) {
  if (!notification) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg ${
        notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
      } text-white font-semibold`}
    >
      {notification.message}
    </motion.div>
  );
}

export default function MemberProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);

  const getToken = () => localStorage.getItem('token');

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        showToast('Failed to load profile', 'error');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const getInitials = () => {
    if (!userData) return 'U';
    const first = userData.first_name?.[0] || '';
    const last = userData.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getAvatarColor = () => {
    if (!userData?.email) return 'bg-zinc-600';
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-purple-600', 
      'bg-pink-600', 'bg-indigo-600', 'bg-red-600',
      'bg-orange-600', 'bg-teal-600'
    ];
    const index = userData.email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-900 pb-20">
      <Toast notification={notification} />
      
      {/* Cover Image Area */}
      <div className="h-48 md:h-64 bg-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* LEFT COLUMN */}
          <motion.div variants={fadeInUp} className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100 p-6 flex flex-col items-center text-center relative">
              
              {/* Avatar with Initials */}
              <div className="relative">
                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${getAvatarColor()} ring-4 ring-zinc-50 shadow-lg mb-4 flex items-center justify-center`}>
                   <span className="text-4xl md:text-5xl font-black text-white">
                     {getInitials()}
                   </span>
                </div>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                {userData?.first_name} {userData?.last_name}
              </h1>
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-1 mb-4">
                Member
              </p>

              <div className="flex gap-2 w-full mt-2">
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="flex-1 bg-zinc-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                 >
                   <Edit3 className="w-4 h-4" /> Edit Profile
                 </button>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-zinc-100 space-y-4 text-left">
                 <InfoRow icon={Mail} label="Email" value={userData?.email} />
                 <InfoRow icon={Phone} label="Phone" value={userData?.phone || 'Not set'} />
                 <InfoRow icon={MapPin} label="Location" value="Sidon, Lebanon" />
              </div>
            </div>

            {/* Membership Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Membership</h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-zinc-600">Status</span>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                     userData?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                   }`}>
                     {userData?.is_active ? 'Active' : 'Inactive'}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-zinc-600">Role</span>
                   <span className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-700">
                     {userData?.role}
                   </span>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div variants={fadeInUp} className="lg:w-2/3 space-y-6 pt-0 lg:pt-20">
            
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Personal Information</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <DetailItem label="Full Name" value={`${userData?.first_name} ${userData?.last_name}`} />
                  <DetailItem label="Email Address" value={userData?.email} />
                  <DetailItem label="Phone Number" value={userData?.phone || 'Not set'} />
                  <DetailItem label="Gender" value={userData?.gender || 'Not specified'} />
                  <DetailItem 
                    label="Date of Birth" 
                    value={userData?.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not set'} 
                  />
                  <DetailItem 
                    label="Member Since" 
                    value={userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    }) : 'N/A'} 
                  />
               </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900">
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Account Settings</h2>
               </div>
               <div className="space-y-4">
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="w-full md:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-semibold transition-colors flex items-center gap-2"
                 >
                   <Edit3 className="w-4 h-4" />
                   Update Profile Information
                 </button>
               </div>
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* EDIT MODAL */}
      <EditProfileModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        initialUser={userData}
        refreshData={fetchProfileData}
        showToast={showToast}
        API_URL={API_URL}
        token={getToken()}
      />

    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase">{label}</p>
        <p className="text-sm font-medium text-zinc-900 break-all">{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="border-b border-zinc-50 pb-2 last:border-0">
      <p className="text-xs font-bold text-zinc-400 uppercase mb-1">{label}</p>
      <p className="font-medium text-zinc-900">{value}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900">
      <div className="flex flex-col items-center animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-zinc-900" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Profile...</p>
      </div>
    </div>
  );
}

function EditProfileModal({ isOpen, onClose, initialUser, refreshData, showToast, API_URL, token }) {
  const [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState({});

  useEffect(() => {
    if (isOpen && initialUser) {
      setUserForm({
        first_name: initialUser.first_name || '',
        last_name: initialUser.last_name || '',
        phone: initialUser.phone || '',
        gender: initialUser.gender || '',
        date_of_birth: initialUser.date_of_birth || ''
      });
    }
  }, [isOpen, initialUser]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(userForm)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      showToast('Profile updated successfully');
      refreshData();
      onClose();
      
    } catch (error) {
      console.error(error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none"
          >
             <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                   <div>
                     <h2 className="text-lg font-black text-zinc-900">Edit Profile</h2>
                     <p className="text-xs text-zinc-500">Update your personal information</p>
                   </div>
                   <button 
                     onClick={onClose} 
                     className="p-2 bg-white hover:bg-zinc-200 rounded-full transition-colors"
                   >
                      <X className="w-4 h-4 text-zinc-500" />
                   </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup 
                        label="First Name" 
                        value={userForm.first_name} 
                        onChange={v => setUserForm({...userForm, first_name: v})} 
                      />
                      <InputGroup 
                        label="Last Name" 
                        value={userForm.last_name} 
                        onChange={v => setUserForm({...userForm, last_name: v})} 
                      />
                    </div>
                    
                    <InputGroup 
                      label="Phone Number" 
                      value={userForm.phone} 
                      onChange={v => setUserForm({...userForm, phone: v})} 
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup 
                        label="Date of Birth" 
                        type="date" 
                        value={userForm.date_of_birth} 
                        onChange={v => setUserForm({...userForm, date_of_birth: v})} 
                      />
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">
                          Gender
                        </label>
                        <select 
                          value={userForm.gender || ''} 
                          onChange={e => setUserForm({...userForm, gender: e.target.value})}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                   <button 
                     onClick={onClose} 
                     className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleSave} 
                     disabled={loading}
                     className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-zinc-200 flex items-center gap-2 disabled:opacity-70"
                   >
                     {loading ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <Save className="w-4 h-4" />
                     )}
                     Save Changes
                   </button>
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InputGroup({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">
        {label}
      </label>
      <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
      />
    </div>
  );
}
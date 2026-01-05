import { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Award, Edit3, Camera, Save, X, 
  ShieldCheck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from '../../components/Toast.jsx';

const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop&q=60";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function TrainerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [trainerData, setTrainerData] = useState(null);
  
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
      const headers = { 'Authorization': `Bearer ${token}` };

      const [authRes, trainerRes] = await Promise.all([
        fetch(`${API_URL}/auth/me`, { headers }),
        fetch(`${API_URL}/trainer/profile/`, { headers })
      ]);

      if (authRes.ok) {
        const authJson = await authRes.json();
        setUserData(authJson.user);
      }

      if (trainerRes.ok) {
        const trainerJson = await trainerRes.json();
        setTrainerData(trainerJson);
      } else if (trainerRes.status === 404) {
        setTrainerData({});
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

  // --- UI Render ---
  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-900 pb-20">
      <Toast notification={notification} />
      
      {/* --- Cover Image Area (Decorative) --- */}
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
          <motion.div variants={fadeInUp} className="lg:w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100 p-6 flex flex-col items-center text-center relative">
              
              <div className="relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-white ring-4 ring-zinc-50 shadow-lg mb-4 overflow-hidden">
                   <img 
                    src={trainerData?.profile_picture_url ? `${API_URL.replace('/api', '')}${trainerData.profile_picture_url}` : DEFAULT_AVATAR} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                   />
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-4 right-2 p-2 bg-zinc-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                {userData?.first_name} {userData?.last_name}
              </h1>
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-1 mb-4">
                {trainerData?.specialization || 'Fitness Trainer'}
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
                 <InfoRow icon={MapPin} label="Location" value="Beirut, Lebanon" />
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Trainer Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                 <StatBox label="Experience" value={`${trainerData?.years_of_experience || 0} Yrs`} />
                 <StatBox label="Rate" value={`$${trainerData?.hourly_rate || 0}/hr`} />
                 <StatBox label="Height" value={`${trainerData?.height || '-'} cm`} />
                 <StatBox label="Weight" value={`${trainerData?.weight || '-'} kg`} />
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT COLUMN: Details --- */}
          <motion.div variants={fadeInUp} className="lg:w-2/3 space-y-6 pt-0 lg:pt-20">
            
            {/* Bio Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><User className="w-5 h-5" /></div>
                  <h2 className="text-xl font-bold text-zinc-900">About Me</h2>
               </div>
               <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                 {trainerData?.bio || "No bio added yet. Click 'Edit Profile' to tell your clients about yourself."}
               </p>
            </div>

            {/* Certifications Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><Award className="w-5 h-5" /></div>
                  <h2 className="text-xl font-bold text-zinc-900">Certifications & Skills</h2>
               </div>
               
               {trainerData?.certifications ? (
                 <div className="flex flex-wrap gap-2">
                   {trainerData.certifications.split(',').map((cert, index) => (
                     <span key={index} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700">
                       {cert.trim()}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-zinc-400 italic">No certifications listed.</p>
               )}
            </div>

            {/* Personal Details Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><ShieldCheck className="w-5 h-5" /></div>
                  <h2 className="text-xl font-bold text-zinc-900">Personal Information</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <DetailItem label="Full Name" value={`${userData?.first_name} ${userData?.last_name}`} />
                  <DetailItem label="Date of Birth" value={userData?.date_of_birth || 'Not set'} />
                  <DetailItem label="Gender" value={userData?.gender || 'Not specified'} />
                  <DetailItem label="Member Since" value={new Date().getFullYear()} />
               </div>
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* --- EDIT MODAL --- */}
      <EditProfileModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        initialUser={userData}
        initialTrainer={trainerData}
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

function StatBox({ label, value }) {
  return (
    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center hover:bg-zinc-100 transition-colors">
      <p className="text-lg font-black text-zinc-900">{value}</p>
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
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

function EditProfileModal({ isOpen, onClose, initialUser, initialTrainer, refreshData, showToast, API_URL, token }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);

  // Form States
  const [userForm, setUserForm] = useState({});
  const [trainerForm, setTrainerForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setUserForm({
        first_name: initialUser?.first_name || '',
        last_name: initialUser?.last_name || '',
        phone: initialUser?.phone || '',
        gender: initialUser?.gender || '',
        date_of_birth: initialUser?.date_of_birth || ''
      });
      setTrainerForm({
        specialization: initialTrainer?.specialization || '',
        years_of_experience: initialTrainer?.years_of_experience || '',
        hourly_rate: initialTrainer?.hourly_rate || '',
        bio: initialTrainer?.bio || '',
        height: initialTrainer?.height || '',
        weight: initialTrainer?.weight || '',
        certifications: initialTrainer?.certifications || ''
      });
      setPreviewUrl(null);
      setImageFile(null);
    }
  }, [isOpen, initialUser, initialTrainer]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update Personal Info (User Table)
      if (activeTab === 'personal') {
        const res = await fetch(`${API_URL}/trainer/profile/update-profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(userForm)
        });
        if (!res.ok) throw new Error('Failed to update personal info');
        showToast('Personal info updated');
      }

      // 2. Update Professional Info (Trainer Table)
      if (activeTab === 'professional') {
        const res = await fetch(`${API_URL}/trainer/profile/`, {
          method: 'PUT', // or POST if it didn't exist, but logic handles create if missing in backend typically, or we check initialTrainer
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(trainerForm)
        });
        if (!res.ok) throw new Error('Failed to update trainer info');
        showToast('Professional info updated');
      }

      // 3. Upload Image
      if (activeTab === 'picture' && imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const res = await fetch(`${API_URL}/trainer/profile/upload-picture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Failed to upload image');
        showToast('Profile picture updated');
      }

      refreshData();
      if (activeTab === 'picture') onClose();
      
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" 
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
                     <p className="text-xs text-zinc-500">Update your information</p>
                   </div>
                   <button onClick={onClose} className="p-2 bg-white hover:bg-zinc-200 rounded-full transition-colors">
                      <X className="w-4 h-4 text-zinc-500" />
                   </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-100 px-6 gap-6">
                  {['personal', 'professional', 'picture'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                  
                  {activeTab === 'personal' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="First Name" value={userForm.first_name} onChange={v => setUserForm({...userForm, first_name: v})} />
                        <InputGroup label="Last Name" value={userForm.last_name} onChange={v => setUserForm({...userForm, last_name: v})} />
                      </div>
                      <InputGroup label="Phone Number" value={userForm.phone} onChange={v => setUserForm({...userForm, phone: v})} />
                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Date of Birth" type="date" value={userForm.date_of_birth} onChange={v => setUserForm({...userForm, date_of_birth: v})} />
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Gender</label>
                          <select 
                            value={userForm.gender} 
                            onChange={e => setUserForm({...userForm, gender: e.target.value})}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'professional' && (
                    <div className="space-y-4">
                       <InputGroup label="Specialization (e.g. HIIT, Yoga)" value={trainerForm.specialization} onChange={v => setTrainerForm({...trainerForm, specialization: v})} />
                       
                       <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Years Experience" type="number" value={trainerForm.years_of_experience} onChange={v => setTrainerForm({...trainerForm, years_of_experience: v})} />
                          <InputGroup label="Hourly Rate ($)" type="number" value={trainerForm.hourly_rate} onChange={v => setTrainerForm({...trainerForm, hourly_rate: v})} />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Height (cm)" type="number" value={trainerForm.height} onChange={v => setTrainerForm({...trainerForm, height: v})} />
                          <InputGroup label="Weight (kg)" type="number" value={trainerForm.weight} onChange={v => setTrainerForm({...trainerForm, weight: v})} />
                       </div>

                       <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Bio</label>
                         <textarea 
                           rows={4}
                           value={trainerForm.bio}
                           onChange={e => setTrainerForm({...trainerForm, bio: e.target.value})}
                           className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none resize-none"
                           placeholder="Tell us about your fitness journey..."
                         />
                       </div>
                       
                       <InputGroup label="Certifications (comma separated)" value={trainerForm.certifications} onChange={v => setTrainerForm({...trainerForm, certifications: v})} />
                    </div>
                  )}

                  {activeTab === 'picture' && (
                    <div className="flex flex-col items-center justify-center py-8">
                       <div className="w-48 h-48 rounded-full bg-zinc-100 border-4 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden mb-6 relative">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-16 h-16 text-zinc-300" />
                          )}
                       </div>
                       
                       <label className="cursor-pointer bg-zinc-900 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Select New Photo
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                       </label>
                       <p className="text-xs text-zinc-400 mt-4">Allowed: .jpg, .png, .jpeg</p>
                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                   <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900">Cancel</button>
                   <button 
                     onClick={handleSave} 
                     disabled={loading}
                     className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-zinc-200 flex items-center gap-2 disabled:opacity-70"
                   >
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">{label}</label>
      <input 
        type={type} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
      />
    </div>
  );
}
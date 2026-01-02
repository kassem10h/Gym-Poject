import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Calendar, Clock, 
  Users, DollarSign, Eye, Tag, Settings, MoreHorizontal, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Helpers ---
const CLASS_IMAGES = {
  boxing: "https://images.unsplash.com/photo-1546711076-85a7923432ab?q=80&w=765&auto=format&fit=crop",
  yoga: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1170&auto=format&fit=crop",
  cardio: "https://images.unsplash.com/photo-1614691771330-13f4e0deec54?q=80&w=735&auto=format&fit=crop",
  hiit: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1169&auto=format&fit=crop",
  pilates: "https://images.unsplash.com/photo-1731325632687-51e90609e700?q=80&w=1631&auto=format&fit=crop",
  crossfit: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1025&auto=format&fit=crop",
  cycling: "https://images.unsplash.com/photo-1545575439-3261931f52f1?q=80&w=1171&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600"
};

const getClassImage = (classType) => {
  if (!classType) return CLASS_IMAGES.default;
  const normalizedType = classType.toLowerCase();
  const foundKey = Object.keys(CLASS_IMAGES).find(key => normalizedType.includes(key));
  return foundKey ? CLASS_IMAGES[foundKey] : CLASS_IMAGES.default;
};

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function TrainerSessionsPage() {
  // --- State ---
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showClassTypesModal, setShowClassTypesModal] = useState(false);
  
  // Edit/Selection States
  const [editingSession, setEditingSession] = useState(null);
  const [editingClassType, setEditingClassType] = useState(null);
  const [selectedSessionBookings, setSelectedSessionBookings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('token');

  // Forms
  const [formData, setFormData] = useState({
    class_type_id: '', date: '', start_time: '', end_time: '', price: '', max_members: ''
  });
  const [classTypeForm, setClassTypeForm] = useState({ name: '', description: '' });

  // --- API Handlers ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const [sessionsRes, typesRes] = await Promise.all([
        fetch(`${API_URL}/sessions`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/sessions/class-types`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setClassTypes(data.class_types || []);
      }
    } catch (error) {
      console.error(error);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchSessionBookings = async (sessionId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/${sessionId}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSessionBookings(data);
        setShowBookingsModal(true);
      }
    } catch (error) { console.error(error); }
  };

  // --- CRUD Handlers (Simplified for brevity, same logic as before) ---
  const handleSessionSubmit = async () => {
    try {
      const token = getToken();
      const url = editingSession ? `${API_URL}/sessions/${editingSession.id}` : `${API_URL}/sessions`;
      const method = editingSession ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          class_type_id: parseInt(formData.class_type_id),
          price: parseFloat(formData.price),
          max_members: parseInt(formData.max_members)
        })
      });

      if (response.ok) {
        showNotification(editingSession ? 'Session updated' : 'Session created');
        setShowModal(false);
        resetForm();
        fetchData();
      }
    } catch (e) { showNotification('Operation failed', 'error'); }
  };

  const handleClassTypeSubmit = async () => {
    try {
      const token = getToken();
      const url = editingClassType ? `${API_URL}/sessions/class-types/${editingClassType.id}` : `${API_URL}/sessions/class-types`;
      const method = editingClassType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(classTypeForm)
      });

      if (response.ok) {
        showNotification('Class type saved');
        resetClassTypeForm();
        fetchData(); // Refresh both to update lists
      }
    } catch (e) { showNotification('Operation failed', 'error'); }
  };

  const handleDelete = async (id, type = 'session') => {
    if (!confirm('Are you sure? This action is permanent.')) return;
    try {
      const token = getToken();
      const url = type === 'session' ? `${API_URL}/sessions/${id}` : `${API_URL}/sessions/class-types/${id}`;
      await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      showNotification('Deleted successfully');
      fetchData();
    } catch (e) { showNotification('Delete failed', 'error'); }
  };

  // --- Utility ---
  const resetForm = () => {
    setEditingSession(null);
    setFormData({ class_type_id: '', date: '', start_time: '', end_time: '', price: '', max_members: '' });
  };
  const resetClassTypeForm = () => {
    setEditingClassType(null);
    setClassTypeForm({ name: '', description: '' });
  };

  const filteredSessions = sessions.filter(s => s.class_type.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white pb-20">
      
      {/* Toast */}
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

      {/* Top Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Sessions Management</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Manage your sessions</p>
          </div>
          
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowClassTypesModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
            >
              <Settings className="w-4 h-4" /> Types
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              <Plus className="w-4 h-4" /> Create Session
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by class name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
             <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Sessions:</span>
             <span className="font-black text-zinc-900">{sessions.length}</span>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-300">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-4"/>
            <p className="text-sm font-medium uppercase tracking-widest">Loading Data</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-300">
            <h3 className="text-lg font-bold text-zinc-900">No Sessions Found</h3>
            <p className="text-zinc-500 mt-2">Create a new session to get started.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredSessions.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onEdit={() => { setEditingSession(session); setFormData({
                  class_type_id: session.class_type_id, date: session.date,
                  start_time: session.start_time, end_time: session.end_time,
                  price: session.price, max_members: session.max_members
                }); setShowModal(true); }}
                onDelete={() => handleDelete(session.id)}
                onView={() => fetchSessionBookings(session.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Create/Edit Session Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSession ? 'Edit Session' : 'New Session'}>
        <div className="space-y-5">
           <div>
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Class Type</label>
             <select 
               value={formData.class_type_id}
               onChange={e => setFormData({...formData, class_type_id: e.target.value})}
               className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
             >
               <option value="">Select Type</option>
               {classTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
             </select>
           </div>
           
           <div>
             <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Date</label>
             <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Start</label>
                <input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">End</label>
                <input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Price ($)</label>
                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Max People</label>
                <input type="number" value={formData.max_members} onChange={e => setFormData({...formData, max_members: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none" />
              </div>
           </div>

           <div className="pt-4 flex gap-3">
             <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
             <button onClick={handleSessionSubmit} className="flex-1 py-3 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">
               {editingSession ? 'Save Changes' : 'Create Session'}
             </button>
           </div>
        </div>
      </Modal>

      {/* 2. Manage Class Types Modal */}
      <Modal isOpen={showClassTypesModal} onClose={() => setShowClassTypesModal(false)} title="Manage Class Types">
         <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-6">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">{editingClassType ? 'Edit Type' : 'Add New Type'}</h4>
            <div className="flex gap-3">
               <input 
                 type="text" 
                 placeholder="Name (e.g. Boxing)" 
                 value={classTypeForm.name}
                 onChange={e => setClassTypeForm({...classTypeForm, name: e.target.value})}
                 className="flex-1 p-2 bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
               />
               <button onClick={handleClassTypeSubmit} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-black">
                 {editingClassType ? 'Update' : 'Add'}
               </button>
            </div>
         </div>

         <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {classTypes.map(ct => (
              <div key={ct.id} className="flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-300 transition-colors group">
                 <span className="font-medium text-zinc-800">{ct.name}</span>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingClassType(ct); setClassTypeForm({ name: ct.name, description: ct.description || '' }); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(ct.id, 'type')} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </Modal>

      {/* 3. Bookings List Modal */}
      <Modal isOpen={showBookingsModal} onClose={() => setShowBookingsModal(false)} title="Attendance List">
        {selectedSessionBookings && (
          <div>
            <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl mb-6">
               <div className="w-12 h-12 rounded-lg bg-zinc-200 flex items-center justify-center font-bold text-zinc-500">
                  {selectedSessionBookings.bookings.length}
               </div>
               <div>
                  <h3 className="font-bold text-zinc-900">{selectedSessionBookings.session.class_type}</h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {new Date(selectedSessionBookings.session.date).toLocaleDateString()} • {selectedSessionBookings.session.start_time}
                  </p>
               </div>
            </div>

            <div className="space-y-3">
               {selectedSessionBookings.bookings.length === 0 ? (
                 <p className="text-center text-zinc-400 text-sm py-8">No bookings yet.</p>
               ) : (
                 selectedSessionBookings.bookings.map((b, i) => (
                   <div key={b.id} className="flex items-center justify-between p-3 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-mono text-zinc-300">{(i+1).toString().padStart(2, '0')}</span>
                         <div>
                            <p className="text-sm font-bold text-zinc-900">{b.member_name}</p>
                            <p className="text-xs text-zinc-500">{b.member_email}</p>
                         </div>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded">Confirmed</div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

// --- Sub-Component: Session Card ---
function SessionCard({ session, onEdit, onDelete, onView }) {
  const image = getClassImage(session.class_type);
  const isFull = session.is_full;
  
  // Format Date cleanly
  const dateObj = new Date(session.date + 'T00:00:00');
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

  return (
    <motion.div 
      variants={itemVariants}
      className="group relative bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-colors flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-40 overflow-hidden">
         <img src={image} alt={session.class_type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
         
         {/* Date Badge */}
         <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg p-2 text-center min-w-[50px]">
            <div className="text-[10px] font-bold uppercase tracking-wider">{month}</div>
            <div className="text-lg font-black leading-none">{day}</div>
         </div>

         {/* Price Tag */}
         <div className="absolute top-3 right-3 bg-zinc-900 text-white px-2.5 py-1 rounded text-xs font-bold">
            ${session.price}
         </div>

         {/* Title Overlay */}
         <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-white text-xl font-black tracking-tight leading-none shadow-black drop-shadow-lg">
               {session.class_type}
            </h3>
         </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
         <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-zinc-400" />
               <span className="text-xs font-semibold text-zinc-600">{session.start_time}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
               <Users className="w-4 h-4 text-zinc-400" />
               <span className={`text-xs font-bold ${isFull ? 'text-red-600' : 'text-zinc-600'}`}>
                 {session.current_bookings}/{session.max_members}
               </span>
            </div>
         </div>

         {/* Actions Footer */}
         <div className="mt-auto pt-4 border-t border-zinc-100 flex gap-2">
            <button onClick={onView} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs font-bold uppercase rounded transition-colors">
               <Eye className="w-3.5 h-3.5" /> View Bookings
            </button>
            <div className="flex gap-1">
              <button onClick={onEdit} className="w-8 h-full flex items-center justify-center bg-zinc-50 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-400 rounded transition-colors">
                 <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="w-8 h-full flex items-center justify-center bg-zinc-50 hover:bg-red-50 hover:text-red-600 text-zinc-400 rounded transition-colors">
                 <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

// --- Sub-Component: Clean Modal ---
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
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
                   <h2 className="text-lg font-black text-zinc-900 tracking-tight">{title}</h2>
                   <button onClick={onClose} className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors">
                      <X className="w-4 h-4 text-zinc-500" />
                   </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                   {children}
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
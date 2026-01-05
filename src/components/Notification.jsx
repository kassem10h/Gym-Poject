import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, ExternalLink, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

const notificationSound = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Ref to track previous count for sound triggering
  const prevUnreadCount = useRef(0);
  const dropdownRef = useRef(null);
  const audioRef = useRef(new Audio(notificationSound));
  
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('token');

  const playSound = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.log("Audio play failed (interaction required):", e));
  };

  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


      if (res.status === 401) {
        localStorage.removeItem("token");
        setUnreadCount(0);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/notifications/?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, link) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (link) {
        navigate(link);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // If we deleted an unread one, decrease count locally
        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Poll for updates & Play Sound
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Watch for count increase to play sound
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      playSound();
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Bell Trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-full transition-all duration-300 ${
            isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
          transition={{ repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3, duration: 0.5 }}
        >
          <Bell className="w-6 h-6" />
        </motion.div>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                   {unreadCount} New
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                  <span className="text-xs">Loading updates...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-center px-6">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Inbox className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">All caught up!</p>
                  <p className="text-xs mt-1">No new notifications at the moment.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  <AnimatePresence mode='popLayout'>
                    {notifications.map((notif) => (
                      <motion.li
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => markAsRead(notif.id, notif.link)}
                        className={`group relative p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notif.is_read ? 'bg-indigo-50/40' : 'bg-transparent'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Indicator Dot */}
                          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            !notif.is_read ? 'bg-indigo-600 shadow-sm shadow-indigo-300' : 'bg-gray-200'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1">
                              {formatTime(notif.created_at)}
                              {notif.link && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </p>
                          </div>

                          {/* Delete Action */}
                          <button
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="absolute top-3 right-3 p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors py-1 px-4 rounded-lg hover:bg-white hover:shadow-sm"
              >
                View full history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
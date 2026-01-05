import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldCheck, FileSearch, Mail, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

const TrainerWaitingPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );


  useEffect(() => {
    const checkTrainerStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Verification failed');
        }

        const data = await response.json();
        
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'Trainer' && data.user.is_active) {
          navigate('/trainer/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error checking trainer status:', error);
      }
    };

    checkTrainerStatus();
    const interval = setInterval(checkTrainerStatus, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white border border-gray-100 shadow-2xl rounded-[2.5rem] p-8 md:p-12 text-center"
      >
        {/* Animated Icon Header */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-blue-100 rounded-full opacity-50"
          />
          <div className="relative bg-blue-600 w-24 h-24 rounded-full flex items-center justify-center shadow-xl shadow-blue-200">
            <ShieldCheck className="h-12 w-12 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
          Application Under Review
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Hey <span className="font-bold text-blue-600">{user?.name || 'Coach'}</span>, thanks for joining FitZone! Our admin team is currently reviewing your certifications and profile to ensure the highest quality for our members.
        </p>

        {/* Status Steps */}
        <div className="grid gap-4 mb-10 text-left">
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
            <div className="bg-green-500 rounded-full p-1 mt-1">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900">Application Submitted</p>
              <p className="text-sm text-green-700">Your profile details have been received.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden">
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <div className="bg-blue-600 rounded-full p-1 mt-1">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-900">Verification in Progress</p>
              <p className="text-sm text-blue-700">Admin is currently reviewing your credentials.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 opacity-60">
            <div className="bg-gray-300 rounded-full p-1 mt-1">
              <ChevronRight className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Access Granted</p>
              <p className="text-sm text-gray-500">You'll receive an email once approved.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Mail className="h-4 w-4" />
            <span>Need help? Contact <a href="mailto:support@fitzone.com" className="text-blue-600 font-medium hover:underline">support@fitzone.com</a></span>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2"
            >
              Back to Home
            </button>
            <button 
              onClick={handleLogout}
              className="px-8 py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      <p className="mt-8 text-gray-400 text-sm">
        Usually takes 24-48 hours for review.
      </p>
    </div>
  );
};

export default TrainerWaitingPage;
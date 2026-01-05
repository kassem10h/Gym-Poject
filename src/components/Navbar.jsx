import React, { useState, useEffect } from 'react';
import { Dumbbell, Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Auth Logic
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const token = localStorage.getItem('token');
  const isAuthenticated = !!(user && token);

  const getBasePath = () => {
    return user?.role ? `/${user.role.toLowerCase()}/dashboard` : '/login';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              FitZone
            </span>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition">Features</a>
            <a href="/equipments" className="text-gray-700 hover:text-blue-600 font-medium transition">Equipment</a>
            <a href="/products" className='text-gray-700 hover:text-blue-600 font-medium transition'>Products</a>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.location.href = getBasePath()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </button>
                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 transition">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.href = '/login'} className="text-gray-700 hover:text-blue-600 font-medium">
                  Login
                </button>
                <button 
                  onClick={() => window.location.href = '/signup'}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition shadow-lg"
                >
                  Join Now
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-600">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {isAuthenticated && (
                <button onClick={() => window.location.href = getBasePath()} className="block w-full text-center py-3 bg-blue-50 text-blue-600 rounded-xl font-bold">
                  Go to Dashboard
                </button>
              )}
              <a href="#features" className="block text-center text-gray-700 py-2">Features</a>
              {!isAuthenticated && (
                <button onClick={() => window.location.href = '/login'} className="block w-full py-3 border border-gray-200 rounded-xl">Login</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
import { useState } from 'react';
import { Dumbbell, Menu } from 'lucide-react';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);


  return (
     <nav className="bg-white shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">FitZone</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition">Home</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition">Features</a>
              <a href="/equipment" className="text-gray-700 hover:text-blue-600 font-medium transition">Equipment</a>
              <a href="/store" className="text-gray-700 hover:text-blue-600 font-medium transition">Store</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition">About</a>
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition"
              >
                <a href="/login">Login</a>
              </button>
              <button 
                onClick={() => window.location.href = '/register'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md"
              >
                Register
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <a href="#home" onClick={closeMenu} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Home</a>
                <a href="#features" onClick={closeMenu} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Features</a>
                <a href="/equipment" onClick={closeMenu} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Equipment</a>
                <a href="/store" onClick={closeMenu} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Store</a>
                <a href="#about" onClick={closeMenu} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">About</a>
                <div className="flex flex-col space-y-2 px-4 pt-2">
                  <button 
                    onClick={() => { setShowLoginModal(true); closeMenu(); }}
                    className="w-full py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => window.location.href = '/register'}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
  );
};


export default Navigation;
import React, { useState } from 'react';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { jsx } from 'react/jsx-runtime';

// SVG Icon for the Plus/Close symbol
const PlusIcon = ({ isOpen }) => (
  <svg
    className={`w-8 h-8 text-white transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-45' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6"></path>
  </svg>
);


// Individual Social Media Icon Component
const SocialIcon = ({ href, bgColor, children, distance, isOpen }) => {
  const style = {
    transform: isOpen ? `translateY(-${distance}rem)` : 'translateY(0)',
    transition: `transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${bgColor} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={style}
    >
      {children}
    </a>
  );
};


// Main Floating Social Media Component
const FloatingSocialMedia = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Toggles the open/closed state
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-8 md:right-8 flex flex-col items-center z-50">
      {/* Social Media Icons Container */}
      <div className="relative flex flex-col items-center">
        {/* Facebook Icon */}
        <SocialIcon href="https://www.facebook.com/smartech204?rdid=423FGap0FOtT7vNA&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1YznaNgjDS%2F#" bgColor="bg-blue-600" distance={13} isOpen={isOpen}>
            <FaFacebook className="w-8 h-8" />
        </SocialIcon>

        {/* Instagram Icon */}
        <SocialIcon href="https://www.tiktok.com/@aidibysmarttech?_t=ZS-8xh28t1vU4m&_r=1" bgColor="bg-gray-800" distance={8.5} isOpen={isOpen}>
            <FaTiktok className="w-8 h-8" />
        </SocialIcon>

        {/* WhatsApp Icon */}
        <SocialIcon href="https://wa.me//96171545936" bgColor="bg-green-500" distance={4} isOpen={isOpen}>
            <FaWhatsapp className="w-8 h-8" />
        </SocialIcon>
      </div>

      {/* Main Floating Action Button */}
      <button
        onClick={toggleMenu}
        className="relative z-10 flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full shadow-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
        aria-label="Toggle Social Media Menu"
        aria-expanded={isOpen}
      >
        <PlusIcon isOpen={isOpen} />
      </button>
    </div>

);
};


export default FloatingSocialMedia;
import React from 'react';
import { Dumbbell, Instagram, Twitter, Facebook, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-400 pt-20 pb-10 px-6 font-sans border-t border-zinc-800">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Top Section: Brand & Newsletter --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-zinc-900">
                <Dumbbell className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter uppercase">FitZone</span>
            </div>
            <p className="max-w-md text-zinc-500 font-medium leading-relaxed">
              Transform your body, transform your life. Premium equipment, expert trainers, 
              and a community that pushes you further.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={Instagram} href="#" />
              <SocialLink icon={Twitter} href="#" />
              <SocialLink icon={Facebook} href="#" />
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="lg:pl-10">
            <h3 className="text-white font-black uppercase tracking-wide mb-4">Join the movement</h3>
            <p className="text-sm mb-4 text-zinc-500">Get the latest workout tips and shop discounts.</p>
            <div className="relative max-w-md">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-14 py-4 rounded-2xl focus:ring-2 focus:ring-white/20 focus:border-white outline-none transition-all placeholder:text-zinc-600 font-bold"
              />
              <button className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-zinc-900 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- Middle Section: Links Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-zinc-800/50">
          
          {/* Column 1 */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Explore</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><FooterLink to="#home" label="Home" /></li>
              <li><FooterLink to="#features" label="Features" /></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Shop</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><FooterLink to="/products" label="All Products" /></li>
              <li><FooterLink to="/equipment" label="Equipment" /></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><FooterLink to="/contact" label="Contact Us" /></li>
              <li><FooterLink to="/terms" label="Terms of Service" /></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Visit Us</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500">
              <li>Sidon, South Lebanon</li>
              <li>+961 03 123 456</li>
            </ul>
          </div>
        </div>

        {/* --- Bottom Section --- */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">
          <p>&copy; {new Date().getFullYear()} FitZone Systems.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

// --- Helper Components ---

const FooterLink = ({ to, label }) => (
  <Link 
    to={to} 
    className="hover:text-white hover:translate-x-1 transition-all inline-block"
  >
    {label}
  </Link>
);

const SocialLink = ({ icon: Icon, href }) => (
  <a 
    href={href} 
    className="p-3 bg-zinc-800 rounded-xl hover:bg-white hover:text-zinc-900 transition-all group"
  >
    <Icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
  </a>
);

export default Footer;
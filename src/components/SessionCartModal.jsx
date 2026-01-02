import React from 'react';
import { Calendar, X, Trash2, ArrowRight, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';

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

export default function SessionCartModal({ isOpen, onClose, sessionCart, removeFromSessionCart, loading }) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const hasItems = sessionCart && sessionCart.total_items > 0;
  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Session Cart</h2>
                  {hasItems && (
                    <p className="text-sm text-gray-500">{sessionCart.total_items} {sessionCart.total_items === 1 ? 'session' : 'sessions'}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {!hasItems ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions booked</h3>
                  <p className="text-gray-500 mb-6">Add some training sessions to get started</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Browse Sessions
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {sessionCart.items.map((item, index) => (
                    <motion.div
                      key={item.cart_item_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* Session Icon */}
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                        <img 
                          src={getClassImage(item.class_type)} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          alt={item.class_type}
                        />
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.class_type}
                        </h3>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-3.5 h-3.5" />
                            <span>{item.trainer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.start_time} - {item.end_time}</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromSessionCart(item.cart_item_id)}
                          disabled={loading}
                          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${item.price.toFixed(2)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasItems && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="border-t border-gray-200 p-6 space-y-4 bg-white"
              >
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${sessionCart.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${sessionCart.total_price.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Complete Booking</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
                >
                  Continue Browsing
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import React from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartModal({ isOpen, onClose, cart, updateCartItem, removeFromCart, loading }) {
  if (!isOpen) return null;

  const hasItems = cart && cart.total_items > 0;
  const handleCheckout = () => {
    window.location.href = '/checkout';
  }

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
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                  {hasItems && (
                    <p className="text-sm text-gray-500">{cart.total_items} {cart.total_items === 1 ? 'item' : 'items'}</p>
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
                    <ShoppingCart className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-6">Add some products to get started</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">${item.price.toFixed(2)}</p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                              disabled={loading}
                              className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="px-3 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItem(item.id, item.quantity + 1)}
                              disabled={loading}
                              className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${item.item_total.toFixed(2)}</p>
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
                    <span>${cart.total_price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${cart.total_price.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, CreditCard, Check, AlertCircle, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardDetails, setCardDetails] = useState({
    card_number: '',
    expiry: '',
    cvv: ''
  });
  const [notification, setNotification] = useState(null);
  const [selectedItems, setSelectedItems] = useState({
    products: [],
    sessions: []
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch checkout preview
  const fetchCheckoutPreview = async () => {
    try {
      setLoading(true);
      const token = getToken();

      const response = await fetch(`${API_URL}/checkout/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckoutPreview(data);
        
        // Select all items by default
        setSelectedItems({
          products: data.products.items.map(item => item.cart_item_id),
          sessions: data.sessions.items.map(item => item.cart_item_id)
        });
      } else {
        showNotification('Failed to load checkout', 'error');
      }
    } catch (error) {
      console.error('Error fetching checkout preview:', error);
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutPreview();
  }, []);

  // Toggle item selection
  const toggleProductSelection = (cartItemId) => {
    setSelectedItems(prev => ({
      ...prev,
      products: prev.products.includes(cartItemId)
        ? prev.products.filter(id => id !== cartItemId)
        : [...prev.products, cartItemId]
    }));
  };

  const toggleSessionSelection = (cartItemId) => {
    setSelectedItems(prev => ({
      ...prev,
      sessions: prev.sessions.includes(cartItemId)
        ? prev.sessions.filter(id => id !== cartItemId)
        : [...prev.sessions, cartItemId]
    }));
  };

  // Calculate selected total
  const calculateSelectedTotal = () => {
    if (!checkoutPreview) return 0;
    
    let total = 0;
    
    checkoutPreview.products.items.forEach(item => {
      if (selectedItems.products.includes(item.cart_item_id)) {
        total += item.item_total;
      }
    });
    
    checkoutPreview.sessions.items.forEach(item => {
      if (selectedItems.sessions.includes(item.cart_item_id)) {
        total += item.item_total;
      }
    });
    
    return total;
  };

  // Process checkout
  const handleCheckout = async (e) => {
    e.preventDefault();

    if (selectedItems.products.length === 0 && selectedItems.sessions.length === 0) {
      showNotification('Please select at least one item to checkout', 'error');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!cardDetails.card_number || !cardDetails.expiry || !cardDetails.cvv) {
        showNotification('Please fill in all card details', 'error');
        return;
      }
    }

    try {
      setProcessing(true);
      const token = getToken();

      const response = await fetch(`${API_URL}/checkout/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: {
            product_cart_item_ids: selectedItems.products,
            session_cart_item_ids: selectedItems.sessions
          },
          payment_method: paymentMethod,
          card_details: cardDetails
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Checkout successful!', 'success');
        setTimeout(() => {
          navigate('/checkout/success', { state: { orderData: data } });
        }, 1500);
      } else {
        showNotification(data.error || 'Checkout failed', 'error');
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      showNotification('Network error during checkout', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!checkoutPreview || checkoutPreview.total_items === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add some items to your cart before checking out</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const selectedTotal = calculateSelectedTotal();
  const selectedCount = selectedItems.products.length + selectedItems.sessions.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            {checkoutPreview.products.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Products</h2>
                  <span className="text-sm text-gray-500">({checkoutPreview.products.items.length} items)</span>
                </div>

                <div className="space-y-3">
                  {checkoutPreview.products.items.map(item => (
                    <div key={item.cart_item_id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedItems.products.includes(item.cart_item_id)}
                        onChange={() => toggleProductSelection(item.cart_item_id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          ${item.price} × {item.quantity}
                        </p>
                      </div>
                      
                      <span className="font-bold text-gray-900">${item.item_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Products Subtotal:</span>
                  <span className="text-xl font-bold text-gray-900">${checkoutPreview.products.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Sessions */}
            {checkoutPreview.sessions.items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-900">Training Sessions</h2>
                  <span className="text-sm text-gray-500">({checkoutPreview.sessions.items.length} sessions)</span>
                </div>

                <div className="space-y-3">
                  {checkoutPreview.sessions.items.map(item => (
                    <div key={item.cart_item_id} className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedItems.sessions.includes(item.cart_item_id)}
                        onChange={() => toggleSessionSelection(item.cart_item_id)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mt-1"
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.class_type}</h3>
                        <p className="text-sm text-gray-600">with {item.trainer_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{new Date(item.date + 'T00:00:00').toLocaleDateString()}</span>
                          <span>{item.start_time} - {item.end_time}</span>
                        </div>
                      </div>
                      
                      <span className="font-bold text-gray-900">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Sessions Subtotal:</span>
                  <span className="text-xl font-bold text-gray-900">${checkoutPreview.sessions.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>

              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                {/* Card Details (only for credit card) */}
                {paymentMethod === 'credit_card' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={cardDetails.card_number}
                        onChange={(e) => setCardDetails({ ...cardDetails, card_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Use test card: 4111111111111111</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Order Summary */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Selected Items:</span>
                    <span>{selectedCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-2xl text-indigo-600">${selectedTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || selectedCount === 0}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-5 h-5" />
                  {processing ? 'Processing...' : `Pay $${selectedTotal.toFixed(2)}`}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
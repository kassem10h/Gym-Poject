import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,Check, AlertCircle, X, Star, Clock, Award, TrendingUp, Shield, Zap, Crown
} from 'lucide-react';

export default function MembershipPage() {
  const [currentMembership, setCurrentMembership] = useState(null);
  const [membershipHistory, setMembershipHistory] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [notification, setNotification] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const getToken = () => localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch current membership
  const fetchCurrentMembership = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/membership/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.has_membership) {
          setCurrentMembership(data.membership);
        } else {
          setCurrentMembership(null);
        }
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  // Fetch membership plans
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/membership/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // Fetch membership history
  const fetchHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/membership/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembershipHistory(data.memberships);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentMembership(), fetchPlans(), fetchHistory()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Purchase membership
  const handlePurchase = async () => {
    if (!paymentForm.cardNumber || !paymentForm.expiry || !paymentForm.cvv) {
      showNotification('Please fill in all payment details', 'error');
      return;
    }

    setProcessing(true);

    const purchaseData = {
      membership_type: selectedPlan.type,
      payment_method: 'credit_card',
      card_details: {
        card_number: paymentForm.cardNumber,
        expiry: paymentForm.expiry,
        cvv: paymentForm.cvv
      }
    };

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/membership/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Membership purchased successfully! 🎉', 'success');
        setShowPurchaseModal(false);
        setPaymentForm({ cardNumber: '', expiry: '', cvv: '' });
        await fetchCurrentMembership();
        await fetchHistory();
      } else {
        showNotification(data.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      showNotification('Network error occurred', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Cancel membership
  const handleCancel = async () => {
    setProcessing(true);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/membership/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message, 'success');
        setShowCancelModal(false);
        await fetchCurrentMembership();
        await fetchHistory();
      } else {
        showNotification(data.error || 'Cancellation failed', 'error');
      }
    } catch (error) {
      showNotification('Network error occurred', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getPlanIcon = (type) => {
    switch (type) {
      case 'Premium': return <Crown className="w-6 h-6" />;
      case 'Yearly': return <Star className="w-6 h-6" />;
      case 'Quarterly': return <TrendingUp className="w-6 h-6" />;
      case 'Student': return <Award className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (type) => {
    switch (type) {
      case 'Premium': return 'from-purple-600 to-pink-600';
      case 'Yearly': return 'from-indigo-600 to-blue-600';
      case 'Quarterly': return 'from-green-600 to-teal-600';
      case 'Student': return 'from-orange-600 to-red-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-400 text-sm">Loading your membership...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}
          >
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-10 h-10 text-indigo-600" />
              Membership Management
            </h1>
            <p className="mt-2 text-lg text-gray-600">Manage your gym membership and access</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Membership Section */}
        {currentMembership && !currentMembership.is_expired ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className={`bg-gradient-to-r ${getPlanColor(currentMembership.type)} rounded-2xl shadow-xl p-8 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-4 rounded-xl backdrop-blur-sm">
                      {getPlanIcon(currentMembership.type)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{currentMembership.type} Membership</h2>
                      <p className="text-white text-opacity-90 mt-1">Active and valid</p>
                    </div>
                  </div>
                  {currentMembership.is_active && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg backdrop-blur-sm transition-all"
                    >
                      Cancel Membership
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm opacity-90">Start Date</span>
                    </div>
                    <p className="text-xl font-bold">
                      {new Date(currentMembership.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm opacity-90">End Date</span>
                    </div>
                    <p className="text-xl font-bold">
                      {new Date(currentMembership.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm opacity-90">Days Remaining</span>
                    </div>
                    <p className="text-xl font-bold">{currentMembership.days_remaining} days</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-xl p-8 text-white"
          >
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">No Active Membership</h2>
              <p className="text-gray-300 mb-6">Choose a plan below to get started with your fitness journey</p>
            </div>
          </motion.div>
        )}

        {/* Available Plans */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900 mb-6"
          >
            {currentMembership && !currentMembership.is_expired ? 'Renew or Upgrade' : 'Choose Your Plan'}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-indigo-500 transition-all"
              >
                <div className={`bg-gradient-to-r ${getPlanColor(plan.type)} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                      {getPlanIcon(plan.type)}
                    </div>
                    {plan.type === 'Premium' && (
                      <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold">{plan.type}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-white text-opacity-80 ml-2">/ {plan.duration_days} days</span>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>Full gym access</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" />
                      <span>All equipment & facilities</span>
                    </div>
                    {plan.type === 'Premium' && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">+ Personal training sessions</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowPurchaseModal(true);
                    }}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.type === 'Premium'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {currentMembership && !currentMembership.is_expired ? 'Renew Plan' : 'Choose Plan'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Membership History */}
        {membershipHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Membership History</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Start Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">End Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {membershipHistory.map((membership, index) => (
                      <motion.tr
                        key={membership.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`bg-gradient-to-r ${getPlanColor(membership.type)} p-2 rounded-lg text-white`}>
                              {getPlanIcon(membership.type)}
                            </div>
                            <span className="font-medium text-gray-900">{membership.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(membership.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(membership.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            membership.is_active && !membership.is_expired
                              ? 'bg-green-100 text-green-800'
                              : membership.is_expired
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {membership.is_active && !membership.is_expired ? 'Active' : membership.is_expired ? 'Expired' : 'Cancelled'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className={`bg-gradient-to-r ${getPlanColor(selectedPlan.type)} p-6 text-white relative`}>
                <button
                  onClick={() => !processing && setShowPurchaseModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                    {getPlanIcon(selectedPlan.type)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedPlan.type} Plan</h3>
                    <p className="text-white text-opacity-90">${selectedPlan.price} for {selectedPlan.duration_days} days</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                    placeholder="4111 1111 1111 1111"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use test card: 4111111111111111</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                    <input
                      type="text"
                      value={paymentForm.expiry}
                      onChange={(e) => setPaymentForm({...paymentForm, expiry: e.target.value})}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                    <input
                      type="text"
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">${selectedPlan.price}</span>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={processing}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                      processing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      'Complete Purchase'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Membership?</h3>
                <p className="text-gray-600 mb-6">
                  Your membership will remain active until {currentMembership && new Date(currentMembership.end_date).toLocaleDateString()}. 
                  You won't be charged again.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => !processing && setShowCancelModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Keep Membership
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Cancel Membership'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
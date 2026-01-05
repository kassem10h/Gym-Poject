import React from 'react';
import { CheckCircle, Package, Calendar, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.orderData;
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No order data found</h3>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Payment Status:</span>
              <span className="font-semibold text-green-600">{orderData.payment_status}</span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">${orderData.total_amount.toFixed(2)}</span>
            </div>

            {orderData.order && orderData.order.products_count > 0 && (
              <div className="flex items-center gap-3 py-3 border-b border-gray-200">
                <Package className="w-5 h-5 text-indigo-600" />
                <div className="flex-1">
                  <span className="text-gray-600">Products Ordered:</span>
                  <span className="ml-2 font-semibold text-gray-900">{orderData.order.products_count} items</span>
                </div>
                <span className="text-sm text-gray-500">Order #{orderData.order.order_id}</span>
              </div>
            )}

            {orderData.bookings_count > 0 && (
              <div className="flex items-center gap-3 py-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div className="flex-1">
                  <span className="text-gray-600">Sessions Booked:</span>
                  <span className="ml-2 font-semibold text-gray-900">{orderData.bookings_count} sessions</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booked Sessions Details */}
        {orderData.bookings && orderData.bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Booked Sessions</h2>
            <div className="space-y-3">
              {orderData.bookings.map((booking) => (
                <div key={booking.booking_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.class_type}</h3>
                      <p className="text-sm text-gray-600">with {booking.trainer_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                        <span>{booking.start_time} - {booking.end_time}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(`/${user.role.toLowerCase()}/dashboard/products`)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse More Products
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/${user.role.toLowerCase()}/dashboard`)}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          A confirmation email has been sent to your registered email address
        </p>
      </div>
    </div>
  );
}
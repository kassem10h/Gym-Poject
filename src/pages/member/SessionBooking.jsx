import React, { useState, useEffect } from "react";
import {
  Calendar, Clock, Users, Plus, ShoppingCart, Filter,Dumbbell,
} from "lucide-react";
import useSessionCart from "../../hooks/useSessionCart";
import SessionCartModal from "../../components/SessionCartModal";
import { Toast } from "../../components/Toast";
import { motion, AnimatePresence } from "framer-motion";

const CLASS_IMAGES = {
  boxing:"https://images.unsplash.com/photo-1546711076-85a7923432ab?q=80&w=765&auto=format&fit=crop",
  yoga:"https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=1170&auto=format&fit=crop",
  cardio:"https://images.unsplash.com/photo-1614691771330-13f4e0deec54?q=80&w=735&auto=format&fit=crop",
  hiit:"https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1169&auto=format&fit=crop",
  pilates:"https://images.unsplash.com/photo-1731325632687-51e90609e700?q=80&w=1631&auto=format&fit=crop",
  crossfit:"https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1025&auto=format&fit=crop",
  cycling:"https://images.unsplash.com/photo-1545575439-3261931f52f1?q=80&w=1171&auto=format&fit=crop",
  default:"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600",
};

const getClassImage = (classType) => {
  if (!classType) return CLASS_IMAGES.default;
  const normalizedType = classType.toLowerCase();

  const foundKey = Object.keys(CLASS_IMAGES).find((key) =>
    normalizedType.includes(key)
  );
  return foundKey ? CLASS_IMAGES[foundKey] : CLASS_IMAGES.default;
};

export default function SessionBookingPage() {
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassType, setSelectedClassType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_URL =
    import.meta.env.VITE_REACT_APP_API || "http://localhost:5000/api";
  const {
    sessionCart,
    addToSessionCart,
    removeFromSessionCart,
    loading: cartLoading,
  } = useSessionCart();

  const getToken = () => localStorage.getItem("token");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();

      if (selectedClassType) params.append("class_type_id", selectedClassType);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await fetch(
        `${API_URL}/session-cart/available?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        showNotification("Failed to fetch sessions", "error");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      showNotification("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTypes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/class-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClassTypes(data.class_types || []);
      }
    } catch (error) {
      console.error("Error fetching class types:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedClassType, dateFrom, dateTo]);

  useEffect(() => {
    fetchClassTypes();
  }, []);

  const handleAddToCart = async (sessionId) => {
    const result = await addToSessionCart(sessionId);
    if (result.success) {
      showNotification("Session added to cart!", "success");
      fetchSessions();
    } else {
      showNotification(result.error || "Failed to add session", "error");
    }
  };

  const clearFilters = () => {
    setSelectedClassType("");
    setDateFrom("");
    setDateTo("");
  };

  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Notification Toast */}
      <Toast notification={notification} />
      {/* Header */}

      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Session Booking
              </h1>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-1">
                Book your sessions here
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium hidden sm:block">Session Cart</span>
              {sessionCart && sessionCart.total_items > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                >
                  {sessionCart.total_items}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Filter Sessions"}
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Class Type
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClassType}
                        onChange={(e) => setSelectedClassType(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                      >
                        <option value="">All Classes</option>
                        {classTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      To Date
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        onClick={clearFilters}
                        className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-400 font-medium">Loading schedule...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No sessions found
            </h3>
            <p className="text-gray-500 mt-1">
              Try adjusting your filters to find more classes.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedSessions[date].map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onAdd={() => handleAddToCart(session.id)}
                      isLoading={cartLoading}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Cart Modal */}
      {showCart && (
        <SessionCartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          sessionCart={sessionCart}
          removeFromSessionCart={removeFromSessionCart}
          loading={cartLoading}
        />
      )}
    </div>
  );
}

function SessionCard({ session, onAdd, isLoading }) {
  const isFull = session.is_full;
  const isLowStock =
    session.spots_remaining <= 3 && session.spots_remaining > 0;
  const imageUrl = getClassImage(session.class_type);

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col h-full">
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={session.class_type}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
          <span className="text-sm font-bold text-gray-900">
            ${session.price}
          </span>
        </div>

        {/* Content Over Image */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-white text-xl font-bold tracking-tight shadow-black drop-shadow-md">
            {session.class_type}
          </h3>
          <p className="text-gray-200 text-xs font-medium flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            {session.trainer_name}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">
              {session.start_time} - {session.end_time}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Availability</span>
            <span
              className={`font-medium ${
                isLowStock
                  ? "text-orange-600"
                  : isFull
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {isFull ? "Sold Out" : `${session.spots_remaining} spots left`}
            </span>
          </div>

          {isLowStock && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 text-center">
              Almost full! Book soon.
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onAdd}
          disabled={isLoading || isFull}
          className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95"
          }`}
        >
          {isFull ? (
            "Class Full"
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Book Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

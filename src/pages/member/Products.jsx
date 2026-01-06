import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { 
  ShoppingCart, Search, Filter, Star, X, Check, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, Tag, Minus, Plus, Truck, ShieldCheck,
  User, MessageSquare, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCart from '../../hooks/useCart';
import CartModal from '../../components/CartModal';
import Skeleton from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import RatingModal from '../../components/RatingModal'; //

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0 }
};

const modalContent = {
  hidden: { y: 50, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", damping: 25, stiffness: 300 } 
  },
  exit: { y: 50, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function ProductShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Product Modal & Logic
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Ratings & Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const { cart, addToCart, updateCartItem, removeFromCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();

  const location = useLocation();
  const showHeader = location.pathname.startsWith("/member/dashboard" || "/traienr/dashboard" || "/admin/dashboard");

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Auth Check Helper ---
  const checkAuth = () => {
    // Assuming you store token in localStorage. Adjust key if needed.
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  // --- Fetch Reviews ---
  const fetchReviews = async (productId) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${API_URL}/shop/products/${productId}/ratings?per_page=50`); //
      if (response.ok) {
        const data = await response.json();
        setReviews(data.ratings);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0); 
    setQuantity(1);
    fetchReviews(product.id);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 12
      });

      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (minRating) params.append('min_rating', minRating);

      const response = await fetch(`${API_URL}/shop/products?${params}`); //

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.pages);
      } else {
        showNotification('Failed to fetch products', 'error');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/shop/product-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, searchTerm, minPrice, maxPrice, minRating]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddToCart = async (productId, qty = 1) => {
    if (!checkAuth()) return; // Guard Clause

    const result = await addToCart(productId, qty);
    if (result.success) {
      showNotification('Product added to cart!', 'success');
      if(selectedProduct) setSelectedProduct(null);
    } else {
      showNotification(result.error || 'Failed to add to cart', 'error');
    }
  };

  // --- Handle Rating Submit ---
  const handleRateSubmit = async (rating, review) => {
    if (!selectedProduct) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/shop/products/${selectedProduct.id}/rate`, { //
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, review })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Thank you for your rating!', 'success');
        
        // Update local state to reflect new average immediately
        setSelectedProduct(prev => ({
          ...prev,
          rating: data.average_rating
        }));

        // Update the products list locally to show new stars on grid
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id ? { ...p, rating: data.average_rating } : p
        ));

        // Refresh reviews list
        fetchReviews(selectedProduct.id);
      } else {
        showNotification(data.error || 'Failed to submit rating', 'error');
      }
    } catch (error) {
      console.error(error);
      showNotification('Error submitting rating', 'error');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Notification Toast */}
      {notification && (
        <Toast notification={notification} />
      )}

      {/* Header */}
      <div
        className={`bg-white z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80
          ${showHeader ? "sticky top-0 visible" : "invisible"}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Store
              </h1>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-1">Premium Fitness Gear</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium hidden sm:block">Cart</span>
              {cart && cart.total_items > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
                >
                  {cart.total_items}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search & Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8"
        >
          {/* ... Search Logic Same as before ... */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search premium products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
              />
            </div>
            <motion.button
              whileHover={{ backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-gray-600'}`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mt-2 border-t border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="">All Collections</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Min Price</label>
                    <input type="number" placeholder="$0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Max Price</label>
                    <input type="number" placeholder="$1000+" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Rating</label>
                    <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">All Ratings</option><option value="4">4+ Stars</option><option value="3">3+ Stars</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end mt-2">
                    <button onClick={clearFilters} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                      <X className="w-4 h-4" /> Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <Skeleton count={12} />
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <button onClick={clearFilters} className="mt-6 text-indigo-600 font-semibold hover:underline">Clear all filters</button>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => openProductModal(product)}
              >
                {/* Product Card Content */}
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50"><ShoppingCart className="w-12 h-12 text-gray-200" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Quick View
                     </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-3 mt-1">
                    <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />)}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase">Price</span>
                      <span className="text-xl font-extrabold text-gray-900">${product.price}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id, 1); }}
                      disabled={cartLoading}
                      className="bg-gray-900 hover:bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-gray-200 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="px-6 py-2 bg-white rounded-full shadow-sm text-sm font-semibold text-gray-700 border border-gray-100">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* --- Login Required Modal --- */}
      <AnimatePresence>
        {showLoginPrompt && (
           <motion.div 
            variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowLoginPrompt(false)}
           >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative"
              >
                 <button onClick={() => setShowLoginPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                 <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="w-8 h-8 text-red-500" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
                 <p className="text-gray-500 mb-6">You must be signed in to add items to the cart or rate products.</p>
                 <div className="flex gap-3">
                   <button onClick={() => setShowLoginPrompt(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                   <button onClick={() => { setShowLoginPrompt(false); navigate('/login'); }} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-indigo-600 transition-colors">Sign In</button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* --- Product Modal --- */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              variants={modalBackdrop}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50"
            />
            
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                variants={modalContent}
                initial="hidden" animate="visible" exit="exit"
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row pointer-events-auto relative"
              >
                {/* Close Button Absolute */}
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 right-6 z-10 p-2 bg-white/50 backdrop-blur-md hover:bg-white text-gray-500 hover:text-red-500 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Left Side: Images */}
                <div className="w-full md:w-1/2 bg-gray-50/50 p-6 md:p-10 flex flex-col">
                  <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center mb-6 aspect-square md:aspect-auto">
                     <AnimatePresence mode="wait">
                        <motion.img 
                          key={activeImageIndex}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          src={selectedProduct.images && selectedProduct.images.length > 0 ? selectedProduct.images[activeImageIndex] : ''}
                          className="w-full h-full object-contain p-4"
                          alt={selectedProduct.name}
                        />
                     </AnimatePresence>
                     <div className="absolute top-4 left-4">
                       <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-indigo-200">
                         {selectedProduct.category_name}
                       </span>
                     </div>
                  </div>

                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedProduct.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Details & Reviews */}
                <div className="w-full md:w-1/2 flex flex-col overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-200">
                  <div className="p-8 md:p-12 pb-4">
                    {/* Header Info */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-400">({selectedProduct.rating})</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      </div>
                      
                      <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                        {selectedProduct.name}
                      </h2>
                      
                      <div className="flex items-baseline gap-3 mt-4">
                        <span className="text-4xl font-black text-gray-900 tracking-tight">${selectedProduct.price}</span>
                      </div>
                    </div>

                    <div className="prose prose-sm text-gray-500 mb-8">
                      <p className="leading-relaxed text-base">{selectedProduct.description}</p>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Truck className="w-5 h-5"/></div>
                        <div className="text-xs">
                          <p className="font-bold text-gray-900">Free Shipping</p>
                          <p className="text-gray-500">On orders over $100</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><ShieldCheck className="w-5 h-5"/></div>
                        <div className="text-xs">
                          <p className="font-bold text-gray-900">2 Year Warranty</p>
                          <p className="text-gray-500">100% Authentic</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="space-y-4 mb-10">
                      <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4 px-4">
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Qty</span>
                        </div>
                        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-100">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-3 text-gray-500 hover:text-indigo-600 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </motion.button>
                          <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-3 text-gray-500 hover:text-indigo-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddToCart(selectedProduct.id, quantity)}
                        disabled={cartLoading}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
                      >
                        {cartLoading ? (
                          <span className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5" />
                            <span>Add to Cart - ${(parseFloat(selectedProduct.price) * quantity).toFixed(2)}</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* --- REVIEWS SECTION --- */}
                    <div className="border-t border-gray-100 pt-8">
                       <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Reviews
                          </h3>
                          <button 
                            onClick={() => checkAuth() && setShowRatingModal(true)}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
                          >
                            Write a Review
                          </button>
                       </div>
                       
                       {reviewsLoading ? (
                         <div className="space-y-4">
                           <div className="h-16 bg-gray-100 rounded-xl animate-pulse"/>
                           <div className="h-16 bg-gray-100 rounded-xl animate-pulse"/>
                         </div>
                       ) : reviews.length === 0 ? (
                         <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                           <p className="text-gray-500">No reviews yet. Be the first to rate this!</p>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            {reviews.map((review) => (
                              <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                      {review.user_name ? review.user_name.substring(0,2).toUpperCase() : <User className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900">{review.user_name}</p>
                                      <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                  </span>
                                </div>
                                {review.review && (
                                  <p className="text-sm text-gray-600 mt-1 ml-10">"{review.review}"</p>
                                )}
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Rating Modal Component */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        product={selectedProduct}
        onSubmit={handleRateSubmit}
      />

      {/* Cart Sidebar */}
      {showCart && (
        <CartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          cart={cart}
          updateCartItem={updateCartItem}
          removeFromCart={removeFromCart}
          loading={loading}
        />
      )}
    </div>
  );
}
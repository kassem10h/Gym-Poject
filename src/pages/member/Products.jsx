import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Star, X, Check, AlertCircle, ChevronLeft, ChevronRight, Eye, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCart from '../../hooks/useCart';
import CartModal from '../../components/CartModal';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notification, setNotification] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';
  const { cart, addToCart, updateCartItem, removeFromCart, loading: cartLoading } = useCart();

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch logic remains exactly the same
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

      const response = await fetch(`${API_URL}/shop/products?${params}`);

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

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (result.success) {
      showNotification('Product added to cart!', 'success');
    } else {
      showNotification(result.error || 'Failed to add to cart', 'error');
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
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              notification.type === 'success' 
                ? 'bg-green-50/90 border-green-200 text-green-800' 
                : 'bg-red-50/90 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Header with Gradient */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80">
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
                    <input
                      type="number"
                      placeholder="$0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Max Price</label>
                    <input
                      type="number"
                      placeholder="$1000+"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Rating</label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">All Ratings</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </select>
                  </div>

                  <div className="md:col-span-4 flex justify-end mt-2">
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {/* Skeleton Loading State */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm">We couldn't find what you're looking for. Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="mt-6 text-indigo-600 font-semibold hover:underline">Clear all filters</button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Image Area */}
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <ShoppingCart className="w-12 h-12 text-gray-200" />
                    </div>
                  )}
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Quick View
                     </div>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur shadow-sm text-gray-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded-md">
                      {product.category_name}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`}
                      />
                    ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">({product.rating})</span>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase">Price</span>
                      <span className="text-xl font-extrabold text-gray-900">${product.price}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
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

        {/* Modern Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="px-6 py-2 bg-white rounded-full shadow-sm text-sm font-semibold text-gray-700 border border-gray-100">
              {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2 bg-gray-100 p-8 flex items-center justify-center relative">
                 <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 md:hidden p-2 bg-white rounded-full shadow-md z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-inner bg-white">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-20 h-20 text-gray-200" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 flex flex-col p-8 md:p-10 overflow-y-auto">
                <div className="flex justify-between items-start">
                   <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
                      <Tag className="w-3 h-3" />
                      {selectedProduct.category_name}
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{selectedProduct.name}</h2>
                   </div>
                   <button
                    onClick={() => setSelectedProduct(null)}
                    className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-500 underline underline-offset-4 decoration-gray-300">
                    {selectedProduct.rating} Rating
                  </span>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 flex-grow">
                  <p className="leading-relaxed text-lg">{selectedProduct.description}</p>
                </div>

                <div className="mt-auto border-t border-gray-100 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Price</p>
                      <p className="text-4xl font-black text-gray-900 tracking-tight">${selectedProduct.price}</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleAddToCart(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    disabled={cartLoading}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
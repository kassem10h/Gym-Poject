import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Eye, Search, ChevronDown, Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';
import Card from '../components/ui/Card';
import axios from 'axios';
import { useSearchParams, useLocation } from 'react-router-dom';
import Drawer from '../components/Drawer';
import { Link, useNavigate } from 'react-router-dom';
import createSlug from '../utils/CreateSlug';

const API_URL = import.meta.env.VITE_REACT_APP_API;

// Main Products Page Component
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const brand = searchParams.get("brand") 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaData, setMetaData] = useState({ min_price: 0, max_price: 1000 });
  const location = useLocation();
  const isSale = location.state?.isSale || false;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12); 
  const navigate = useNavigate();

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() =>{
    window.scrollTo(0, 0);
    document.title = "Products - SmartTech";
  });

  useEffect(() => {
    setPage(1);
  }, [category, selectedBrands, priceRange, sortBy, inStockOnly]);

  useEffect(() => {
    if (category) {
      fetchFilteredProducts();
    }
  }, [category, selectedBrands, priceRange, sortBy, inStockOnly, page, limit]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${API_URL}/brands`);
      setBrands(res.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };


  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category_slug', category);
      if (selectedBrands.length > 0) params.append('brand_slugs', selectedBrands.join(','));
      if (priceRange.min > 0) params.append('min_price', priceRange.min.toString());
      if (priceRange.max < 1000) params.append('max_price', priceRange.max.toString());
      if (sortBy) params.append('sort_by', sortBy);
      if (inStockOnly) params.append('in_stock', 'true');
      if (isSale) params.append('is_sale', 'true');
      if (brand) params.append('brand_slugs', brand);
      params.append('page', page);
      params.append('limit', limit);

      const res = await axios.get(`${API_URL}/products/filter?${params.toString()}`);
      setProducts(res.data.products);
      setFilteredProducts(res.data.products);
      setMetaData(res.data.meta);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    } finally {
      setLoading(false);
    }
  };
    const handleClick = (product) => {
      navigate(`/products/${product.id}/${createSlug(product.title)}`);
    }


  const handleBrandToggle = (brandSlug) => {
    setSelectedBrands(prev => 
      prev.includes(brandSlug)
        ? prev.filter(b => b !== brandSlug)
        : [...prev, brandSlug]
    );
  };

  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: parseInt(value)
    }));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceRange({ min: 0, max: 1000 });
    setSortBy('newest');
    setInStockOnly(false);
    setSearchTerm('');
    setIsDrawerOpen(false);
  };

  const currentCategory = categories.find(cat => cat.slug === category);
  const categoryBrands = brands.filter(brand => 
    categories.find(cat => cat.slug === category && cat.id === brand.category_id)
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const filterVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const filterSidebar = (
    <>
    {/* Filters Sidebar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={filterVariants}
            className="lg:w-80"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Category Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category || ''}
                  onChange={e => {
                    navigate(
                      e.target.value
                        ? `/products?category=${e.target.value}`
                        : '/products'
                    );
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Range: ${metaData.min_price} - ${metaData.max_price}
                </div>
              </div>

              {/* Brands */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brands
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categoryBrands.map((brand) => (
                    <motion.label
                      key={brand.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center cursor-pointer"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.slug)}
                        onChange={() => handleBrandToggle(brand.slug)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* In Stock Only */}
              <div className="mb-6">
                <motion.label
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                </motion.label>
              </div>
            </div>
          </motion.div>
          </>
          )
  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900"
              >
                {currentCategory?.name || 'All Products'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-gray-600"
              >
                {filteredProducts.length} products found
              </motion.p>
            </div>
            
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 lg:mt-0 lg:ml-6"
            >
              {/* Mobile Flex Row */}
              <div className="md:hidden flex items-center gap-2">
                {/* Filter Button */}
                <button onClick={() => setIsDrawerOpen(true)} className="p-2 border border-gray-300 rounded-lg">
                  <Filter size={20} />
                </button>

                {/* Search Field */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
              </div>

              {/* Desktop Only Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full lg:w-80"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className='hidden md:block sticky top-24 h-fit'>
            {/* Filters */}
            {filterSidebar}
          </div>

          <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
            {filterSidebar}
          </Drawer>

          {/* Products Grid */}
          <div className="flex-1">
            {/* View Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredProducts.length} products
                </span>
              </div>

            </motion.div>

            {/* Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center py-12"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </motion.div>
            )}

            {/* Products Grid */}
            {!loading && (
              <AnimatePresence mode="wait">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={containerVariants}
                  className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}
                >
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={itemVariants}
                      whileHover={{ 
                        y: -5,
                        transition: { type: "spring", stiffness: 300, damping: 20 }
                      }}
                      className="h-full"
                    >
                      <Link to={`/products/${product.id}/${createSlug(product.title)}`}>
                      <Card
                        id={product.id}
                        image={product.image}
                        title={product.title}
                        description={product.description}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        reviewCount={product.reviewCount}
                        category={product.category}
                        brand={product.brand}
                        inStock={product.inStock}
                        isNew={product.isNew}
                        isSale={product.isSale}
                        onClick={() => handleClick(product)}
                        className="h-full"
                        buttonText="View Details"
                        buttonIcon={<Eye className="h-4 w-4" />}
                      />
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Empty State */}
            {!loading && filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            )}

            {metaData.total_pages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Prev
              </button>
              {[...Array(metaData.total_pages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setPage(idx + 1)}
                  className={`px-3 py-1 rounded border ${page === idx + 1 ? 'bg-blue-600 text-white' : 'bg-white'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === metaData.total_pages}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
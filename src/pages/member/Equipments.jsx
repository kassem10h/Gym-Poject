import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Search, Filter, X, ChevronLeft, ChevronRight, 
  Eye, Tag, Settings, Wrench, ShieldCheck, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function EquipmentPage() {
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 12
      });

      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/shop/equipments?${params}`);

      if (response.ok) {
        const data = await response.json();
        setEquipments(data.equipments);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching equipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/shop/equipment-categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, [currentPage, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (equipment) => {
    setSelectedEquipment(equipment);
    setActiveImageIndex(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEquipments();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Equipment
              </h1>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-1">Professional Gym Gear</p>
            </div>
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
                placeholder="Search equipment..."
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
                <div className="p-4 mt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.equipment_count || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end justify-end">
                    <button onClick={clearFilters} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 mb-2">
                      <X className="w-4 h-4" /> Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : equipments.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <Dumbbell className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No equipment found</h3>
            <button onClick={clearFilters} className="mt-6 text-indigo-600 font-semibold hover:underline">Clear all filters</button>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {equipments.map((equipment) => (
              <motion.div
                key={equipment.id}
                variants={itemVariants}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
                onClick={() => openModal(equipment)}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  {equipment.images && equipment.images.length > 0 ? (
                    <img src={equipment.images[0]} alt={equipment.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50"><Dumbbell className="w-12 h-12 text-gray-200" /></div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> View Specs
                     </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur shadow-sm text-gray-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded-md">
                      {equipment.category_name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors mb-2">{equipment.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{equipment.description}</p>
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

      <AnimatePresence>
        {selectedEquipment && (
          <>
            <motion.div 
              variants={modalBackdrop}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setSelectedEquipment(null)}
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
                  onClick={() => setSelectedEquipment(null)}
                  className="absolute top-6 right-6 z-10 p-2 bg-white/50 backdrop-blur-md hover:bg-white text-gray-500 hover:text-red-500 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="w-full md:w-3/5 bg-gray-50/50 p-6 md:p-10 flex flex-col">
                  {/* Main Image Display */}
                  <div className="relative flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center mb-6 aspect-video md:aspect-auto">
                     <AnimatePresence mode="wait">
                        <motion.img 
                          key={activeImageIndex}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          src={selectedEquipment.images && selectedEquipment.images.length > 0 ? selectedEquipment.images[activeImageIndex] : ''}
                          className="w-full h-full object-contain p-4"
                          alt={selectedEquipment.name}
                        />
                     </AnimatePresence>
                  </div>

                  {/* Thumbnail Strip */}
                  {selectedEquipment.images && selectedEquipment.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {selectedEquipment.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-24 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col overflow-y-auto bg-white">
                  
                  {/* Header Info */}
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
                      <Tag className="w-3 h-3" />
                      {selectedEquipment.category_name}
                    </span>
                    
                    <h2 className="text-3xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                      {selectedEquipment.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <div className="prose prose-sm text-gray-500 mb-8 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                    <p className="leading-relaxed text-base">{selectedEquipment.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8 mt-auto">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Wrench className="w-5 h-5"/></div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">Heavy Duty</p>
                        <p className="text-gray-500">Commercial Build</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="bg-green-100 p-2 rounded-lg text-green-600"><ShieldCheck className="w-5 h-5"/></div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">Warranty</p>
                        <p className="text-gray-500">Industry Standard</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Settings className="w-5 h-5"/></div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">Adjustable</p>
                        <p className="text-gray-500">Multi-Purpose</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Activity className="w-5 h-5"/></div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900">Ergonomic</p>
                        <p className="text-gray-500">High Performance</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = `mailto:sales@gym.com?subject=Inquiry: ${selectedEquipment.name}`}
                      className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                    >
                      <span>Inquire About Pricing</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
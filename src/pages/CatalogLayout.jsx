import React from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function CatalogLayout({
  title,
  subtitle,
  icon: Icon,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  showFilters,
  toggleFilters,
  filterContent,
  clearFilters,
  loading,
  isEmpty,
  emptyMessage = "No items found",
  currentPage,
  totalPages,
  onPageChange,
  children,
  headerAction
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Modern Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm/50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight flex items-center gap-3">
                {Icon && <Icon className="w-8 h-8 text-indigo-600" />}
                {title}
              </h1>
              <p className="text-xs font-medium text-gray-400 tracking-wider uppercase mt-1">
                {subtitle}
              </p>
            </div>
            {headerAction && <div>{headerAction}</div>}
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
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit && onSearchSubmit()}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
              />
            </div>
            <motion.button
              whileHover={{ backgroundColor: "#f3f4f6" }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleFilters}
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
                  {filterContent}
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

        {/* Content Grid */}
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
        ) : isEmpty ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="bg-indigo-50 p-6 rounded-full mb-4">
              <Search className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{emptyMessage}</h3>
            <p className="text-gray-500 max-w-sm">Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="mt-6 text-indigo-600 font-semibold hover:underline">Clear all filters</button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {children}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="px-6 py-2 bg-white rounded-full shadow-sm text-sm font-semibold text-gray-700 border border-gray-100">
              {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-3 border border-gray-200 rounded-full hover:bg-white hover:shadow-md disabled:opacity-30 disabled:hover:shadow-none transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
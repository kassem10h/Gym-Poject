import React, { useState, useEffect } from 'react';
import { Dumbbell, Eye, Image, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogLayout, { itemVariants, modalVariants } from '../../components/CatalogLayout.jsx';

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const EquipmentFilters = (
    <div className="space-y-1 md:col-span-2">
      <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Category</label>
      <select
        value={selectedCategory}
        onChange={(e) => {
          setSelectedCategory(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
      >
        <option value="">All Categories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} ({cat.equipment_count})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <CatalogLayout
        title="Gym Equipment"
        subtitle="Browse our machines & gear"
        icon={Dumbbell}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={() => { setCurrentPage(1); fetchEquipments(); }}
        showFilters={showFilters}
        toggleFilters={() => setShowFilters(!showFilters)}
        clearFilters={clearFilters}
        filterContent={EquipmentFilters}
        loading={loading}
        isEmpty={equipments.length === 0}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      >
        {equipments.map((equipment) => (
          <motion.div
            key={equipment.id}
            variants={itemVariants}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300"
            onClick={() => setSelectedEquipment(equipment)}
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
              {equipment.images && equipment.images.length > 0 ? (
                <img
                  src={equipment.images[0]}
                  alt={equipment.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Dumbbell className="w-12 h-12 text-gray-200" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                 <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> View Details
                 </div>
              </div>

              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur shadow-sm text-gray-900 text-[10px] font-bold px-2 py-1 uppercase tracking-wide rounded-md">
                  {equipment.category_name}
                </span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-indigo-600 transition-colors mb-2">
                {equipment.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {equipment.description}
              </p>
            </div>
          </motion.div>
        ))}
      </CatalogLayout>

      <AnimatePresence>
        {selectedEquipment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEquipment(null)}
          >
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              <div className="w-full md:w-1/2 bg-gray-100 relative group">
                 <button
                    onClick={() => setSelectedEquipment(null)}
                    className="absolute top-4 left-4 md:hidden p-2 bg-white rounded-full shadow-md z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                <div className="h-64 md:h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                    selectedEquipment.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${selectedEquipment.name} view ${idx+1}`}
                        className="w-full rounded-2xl shadow-sm object-cover"
                      />
                    ))
                  ) : (
                    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                      <Image className="w-20 h-20 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col p-8 md:p-10 overflow-y-auto">
                <div className="flex justify-between items-start">
                   <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-4">
                      <Tag className="w-3 h-3" />
                      {selectedEquipment.category_name}
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{selectedEquipment.name}</h2>
                   </div>
                   <button
                    onClick={() => setSelectedEquipment(null)}
                    className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 flex-grow mt-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                  <p className="leading-relaxed text-lg">{selectedEquipment.description}</p>
                </div>

                {selectedEquipment.created_at && (
                  <div className="mt-auto pt-6 border-t border-gray-100 text-sm text-gray-400">
                    Added to inventory on {new Date(selectedEquipment.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
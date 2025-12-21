import React, { useState, useEffect } from 'react';
import { Dumbbell, Search, Filter, X, ChevronLeft, ChevronRight, Image, AlertCircle } from 'lucide-react';

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

  // Fetch equipments
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

  // Fetch categories
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Dumbbell className="w-8 h-8 text-indigo-600" />
                Gym Equipment
              </h1>
              <p className="mt-1 text-sm text-gray-500">Browse our available gym equipment and machines</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.equipment_count})
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-4"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : equipments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {equipments.map((equipment) => (
              <div
                key={equipment.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer"
                onClick={() => setSelectedEquipment(equipment)}
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {equipment.images && equipment.images.length > 0 ? (
                    <img
                      src={equipment.images[0]}
                      alt={equipment.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {equipment.images && equipment.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      +{equipment.images.length - 1} more
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                      {equipment.category_name}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{equipment.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{equipment.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Equipment Details</h2>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                    selectedEquipment.images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${selectedEquipment.name} ${index + 1}`}
                        className="w-full rounded-lg shadow-sm"
                      />
                    ))
                  ) : (
                    <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded">
                      {selectedEquipment.category_name}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900">{selectedEquipment.name}</h1>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedEquipment.description}</p>
                  </div>

                  {selectedEquipment.created_at && (
                    <div className="text-sm text-gray-500">
                      Added on {new Date(selectedEquipment.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
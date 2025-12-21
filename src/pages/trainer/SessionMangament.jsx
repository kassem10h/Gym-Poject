import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Calendar, Clock, Users, DollarSign, CheckCircle, AlertCircle, Eye, Tag, Settings } from 'lucide-react';

export default function TrainerSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showClassTypesModal, setShowClassTypesModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingClassType, setEditingClassType] = useState(null);
  const [selectedSessionBookings, setSelectedSessionBookings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const API_URL = import.meta.env.VITE_REACT_APP_API || 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    class_type_id: '',
    date: '',
    start_time: '',
    end_time: '',
    price: '',
    max_members: ''
  });

  const [classTypeForm, setClassTypeForm] = useState({
    name: '',
    description: ''
  });

  const getToken = () => localStorage.getItem('token');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        showNotification('Failed to fetch sessions', 'error');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      showNotification('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch class types
  const fetchClassTypes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/class-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClassTypes(data.class_types || []);
      }
    } catch (error) {
      console.error('Error fetching class types:', error);
    }
  };

  // Fetch bookings for a session
  const fetchSessionBookings = async (sessionId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/${sessionId}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedSessionBookings(data);
        setShowBookingsModal(true);
      } else {
        showNotification('Failed to fetch bookings', 'error');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showNotification('Network error', 'error');
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchClassTypes();
  }, []);

  // Handle session form submit
  const handleSubmit = async () => {
    try {
      const token = getToken();
      const url = editingSession 
        ? `${API_URL}/sessions/${editingSession.id}`
        : `${API_URL}/sessions`;
      
      const method = editingSession ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          class_type_id: parseInt(formData.class_type_id),
          price: parseFloat(formData.price),
          max_members: parseInt(formData.max_members)
        })
      });

      if (response.ok) {
        showNotification(
          editingSession ? 'Session updated successfully!' : 'Session created successfully!',
          'success'
        );
        setShowModal(false);
        resetForm();
        fetchSessions();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      showNotification('Network error', 'error');
    }
  };

  // Handle class type form submit
  const handleClassTypeSubmit = async () => {
    try {
      const token = getToken();
      const url = editingClassType 
        ? `${API_URL}/sessions/class-types/${editingClassType.id}`
        : `${API_URL}/sessions/class-types`;
      
      const method = editingClassType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classTypeForm)
      });

      if (response.ok) {
        showNotification(
          editingClassType ? 'Class type updated!' : 'Class type created!',
          'success'
        );
        resetClassTypeForm();
        fetchClassTypes();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Error saving class type:', error);
      showNotification('Network error', 'error');
    }
  };

  // Handle delete session
  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification('Session deleted successfully!', 'success');
        fetchSessions();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to delete session', 'error');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showNotification('Network error', 'error');
    }
  };

  // Handle delete class type
  const handleDeleteClassType = async (classTypeId) => {
    if (!confirm('Are you sure you want to delete this class type?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/sessions/class-types/${classTypeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification('Class type deleted!', 'success');
        fetchClassTypes();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Error deleting class type:', error);
      showNotification('Network error', 'error');
    }
  };

  // Handle edit session
  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      class_type_id: session.class_type_id.toString(),
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      price: session.price.toString(),
      max_members: session.max_members.toString()
    });
    setShowModal(true);
  };

  // Handle edit class type
  const handleEditClassType = (classType) => {
    setEditingClassType(classType);
    setClassTypeForm({
      name: classType.name,
      description: classType.description || ''
    });
  };

  const resetForm = () => {
    setEditingSession(null);
    setFormData({
      class_type_id: '',
      date: '',
      start_time: '',
      end_time: '',
      price: '',
      max_members: ''
    });
  };

  const resetClassTypeForm = () => {
    setEditingClassType(null);
    setClassTypeForm({
      name: '',
      description: ''
    });
  };

  const filteredSessions = sessions.filter(session =>
    session.class_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-indigo-600" />
                My Training Sessions
              </h1>
              <p className="mt-1 text-sm text-gray-500">Create and manage your training sessions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClassTypesModal(true)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Manage Class Types
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions by class type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-500 mb-4">Start by creating your first training session</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
                  <h3 className="font-bold text-white text-lg">{session.class_type}</h3>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{formatDate(session.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{session.start_time} - {session.end_time}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-green-600">${session.price}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        <span className={`font-semibold ${session.is_full ? 'text-red-600' : 'text-indigo-600'}`}>
                          {session.current_bookings}
                        </span>
                        <span className="text-gray-500">/{session.max_members}</span>
                      </span>
                    </div>
                    {session.is_full && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                        FULL
                      </span>
                    )}
                    {session.spots_remaining > 0 && session.spots_remaining <= 3 && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-medium">
                        {session.spots_remaining} left
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => fetchSessionBookings(session.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(session)}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSession ? 'Edit Session' : 'Create New Session'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type *
                </label>
                <select
                  value={formData.class_type_id}
                  onChange={(e) => setFormData({ ...formData, class_type_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="">Select a class type</option>
                  {classTypes.map(ct => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
                {classTypes.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No class types available. Create one first!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="25.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Members *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Class Types Modal */}
      {showClassTypesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Manage Class Types</h2>
              </div>
              <button
                onClick={() => {
                  setShowClassTypesModal(false);
                  resetClassTypeForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Add/Edit Form */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  {editingClassType ? 'Edit Class Type' : 'Add New Class Type'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={classTypeForm.name}
                      onChange={(e) => setClassTypeForm({ ...classTypeForm, name: e.target.value })}
                      placeholder="e.g., HIIT Training, Yoga, Boxing"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={classTypeForm.description}
                      onChange={(e) => setClassTypeForm({ ...classTypeForm, description: e.target.value })}
                      placeholder="Brief description of this class type..."
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingClassType && (
                      <button
                        onClick={resetClassTypeForm}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleClassTypeSubmit}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {editingClassType ? 'Update' : 'Add Class Type'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Class Types */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Existing Class Types ({classTypes.length})</h3>
                {classTypes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No class types yet. Add your first one above!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classTypes.map((ct) => (
                      <div key={ct.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{ct.name}</h4>
                          {ct.description && (
                            <p className="text-sm text-gray-500 mt-1">{ct.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditClassType(ct)}
                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClassType(ct.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && selectedSessionBookings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Session Bookings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSessionBookings.session.class_type} - {formatDate(selectedSessionBookings.session.date)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingsModal(false);
                  setSelectedSessionBookings(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="ml-2 font-medium">{selectedSessionBookings.session.start_time} - {selectedSessionBookings.session.end_time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <span className="ml-2 font-medium">{selectedSessionBookings.session.current_bookings}/{selectedSessionBookings.session.max_members}</span>
                  </div>
                </div>
              </div>

              {selectedSessionBookings.bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500">Members will appear here once they book this session</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Registered Members ({selectedSessionBookings.bookings.length})</h3>
                  {selectedSessionBookings.bookings.map((booking, index) => (
                    <div key={booking.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-indigo-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{booking.member_name}</h4>
                        <p className="text-sm text-gray-500">{booking.member_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Booked</p>
                        <p className="text-xs text-gray-600">{new Date(booking.booked_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
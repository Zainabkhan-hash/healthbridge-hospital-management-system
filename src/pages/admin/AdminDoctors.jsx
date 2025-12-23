// pages/admin/AdminDoctors.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  Download,
  Upload
} from 'lucide-react';
import { fetchDoctors, updateDoctor, deleteDoctor } from '../../redux/slices/doctorsSlice';
import { authAPI, doctorsAPI } from '../../services/api';
import DoctorForm from '../../components/DoctorForm';

const AdminDoctors = () => {
  const dispatch = useDispatch();
  const { doctors, isLoading, error } = useSelector((state) => state.doctors);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = filterSpecialization === 'all' || 
                                 doctor.specialization === filterSpecialization;
    const matchesStatus = filterStatus === 'all' || 
                         doctor.status === filterStatus;
    return matchesSearch && matchesSpecialization && matchesStatus;
  });

  const handleSaveDoctor = async (doctorData) => {
    setLoading(true);
    setApiError('');
    try {
      if (editingDoctor) {
        // Update existing doctor using doctorsAPI
        await doctorsAPI.updateDoctor(editingDoctor._id, doctorData);
        console.log('✅ Doctor updated successfully');
        
        // Refresh the doctors list
        dispatch(fetchDoctors());
      } else {
        // Create new doctor using authAPI
        await authAPI.createDoctor(doctorData);
        console.log('✅ Doctor created successfully');
        
        // Refresh the doctors list
        dispatch(fetchDoctors());
      }
      
      // Close modal and reset states
      setShowAddModal(false);
      setEditingDoctor(null);
    } catch (error) {
      console.error('❌ Failed to save doctor:', error);
      setApiError(error.message || 'Failed to save doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await dispatch(deleteDoctor(id)).unwrap();
        console.log('✅ Doctor deleted successfully');
      } catch (error) {
        console.error('❌ Failed to delete doctor:', error);
        setApiError('Failed to delete doctor. Please try again.');
      }
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setShowAddModal(true);
  };

  const handleViewDoctor = (doctor) => {
    setViewingDoctor(doctor);
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingDoctor(null);
    setViewingDoctor(null);
    setApiError('');
  };

  const specializations = [...new Set(doctors.map(doc => doc.specialization).filter(Boolean))];
  const statuses = [...new Set(doctors.map(doc => doc.status).filter(Boolean))];

  // Doctor Detail View Modal
  const DoctorDetailModal = ({ doctor, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Details</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Complete doctor information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-6 h-6 text-gray-500 dark:text-gray-400 rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {doctor.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium">{doctor.specialization}</p>
              <p className="text-gray-600 dark:text-gray-400">{doctor.qualification}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {doctor.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <p className="text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  {doctor.phone}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</label>
                <p className="text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {doctor.experience} years
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</label>
                <p className="text-gray-900 dark:text-white mt-1">{doctor.licenseNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Consultation Fee</label>
                <p className="text-gray-900 dark:text-white mt-1">PKR {doctor.consultationFee}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  doctor.status === 'Available' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : doctor.status === 'Busy'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {doctor.status}
                </span>
              </div>
            </div>
          </div>

          {doctor.address && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
              <p className="text-gray-900 dark:text-white flex items-start gap-2 mt-1">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                {doctor.address}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              handleEditDoctor(doctor);
              setViewingDoctor(null);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Edit Doctor
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctors Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} in the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleAddDoctor}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{apiError}</p>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Doctor Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {doctor.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {doctor.name || 'Unknown Doctor'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {doctor.specialization || 'General Practitioner'}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActionMenu(actionMenu === doctor._id ? null : doctor._id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {actionMenu === doctor._id && (
                    <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 w-32">
                      <button
                        onClick={() => {
                          handleViewDoctor(doctor);
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          handleEditDoctor(doctor);
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteDoctor(doctor._id);
                          setActionMenu(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{doctor.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>{doctor.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{doctor.experience || '0'} years experience</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Fee: PKR {doctor.consultationFee || '0'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doctor.status === 'Available' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : doctor.status === 'Busy'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {doctor.status || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No doctors found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || filterSpecialization !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search filters' 
              : 'Get started by adding your first doctor'
            }
          </p>
          {(searchTerm || filterSpecialization !== 'all' || filterStatus !== 'all') ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSpecialization('all');
                setFilterStatus('all');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={handleAddDoctor}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Add First Doctor
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Doctor Modal */}
      {showAddModal && (
        <DoctorForm
          doctor={editingDoctor}
          onSave={handleSaveDoctor}
          onClose={closeModal}
          loading={loading}
        />
      )}

      {/* View Doctor Modal */}
      {viewingDoctor && (
        <DoctorDetailModal
          doctor={viewingDoctor}
          onClose={() => setViewingDoctor(null)}
        />
      )}
    </div>
  );
};

export default AdminDoctors;
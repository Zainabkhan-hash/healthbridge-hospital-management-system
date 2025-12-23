import React, { useState, useEffect } from "react";
import { Search, Plus, User, Phone, Mail, MapPin, Calendar, MoreVertical, Edit, Trash2, Filter, Loader2 } from "lucide-react";
import { patientsAPI } from "../../services/api";
import PatientForm from "../../components/PatientForm";
import { useSelector } from "react-redux";

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await patientsAPI.getPatients({ limit: 100 });
      
      if (response.success) {
        const patientsData = response.data || response;
        const mappedPatients = Array.isArray(patientsData) ? patientsData.map(patient => ({
          _id: patient._id,
          mrn: patient.mrn || `MRN${String(patient._id).slice(-4)}`,
          name: patient.name || "Unknown Patient",
          age: patient.age || 0,
          gender: patient.gender || "Unknown",
          bloodGroup: patient.bloodGroup || "Unknown",
          phone: patient.phone || "N/A",
          email: patient.email || "N/A",
          address: patient.address || "N/A",
          status: patient.status || "Active",
          createdAt: patient.createdAt || new Date().toISOString(),
          allergies: patient.allergies || [],
          medicalHistory: patient.medicalHistory || "",
          emergencyContact: patient.emergencyContact || ""
        })) : [];
        
        setPatients(mappedPatients);
        setFilteredPatients(mappedPatients);
      } else {
        setError(response.message || "Failed to fetch patients");
        // Fallback data
        const fallbackPatients = getFallbackPatients();
        setPatients(fallbackPatients);
        setFilteredPatients(fallbackPatients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      setError("Failed to load patients. Please try again.");
      const fallbackPatients = getFallbackPatients();
      setPatients(fallbackPatients);
      setFilteredPatients(fallbackPatients);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPatients = () => [
    {
      _id: "1",
      mrn: "MRN001",
      name: "Ali Khan",
      age: 45,
      gender: "Male",
      bloodGroup: "O+",
      phone: "+92 300 1234567",
      email: "ali.khan@example.com",
      address: "House 45, Street 10, G-13/3, Islamabad",
      status: "Active",
      createdAt: new Date().toISOString(),
      allergies: ["Penicillin"],
      medicalHistory: "Hypertension"
    },
    {
      _id: "2",
      mrn: "MRN002",
      name: "Sara Ahmed",
      age: 32,
      gender: "Female",
      bloodGroup: "A+",
      phone: "+92 301 2345678",
      email: "sara.ahmed@example.com",
      address: "Flat 301, Tower A, DHA Phase 5, Karachi",
      status: "Active",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      allergies: ["Aspirin"],
      medicalHistory: "Asthma"
    },
    {
      _id: "3",
      mrn: "MRN003",
      name: "Ahmed Raza",
      age: 58,
      gender: "Male",
      bloodGroup: "B+",
      phone: "+92 302 3456789",
      email: "ahmed.raza@example.com",
      address: "House 23, Street 5, Bahria Town, Lahore",
      status: "Inactive",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      allergies: [],
      medicalHistory: "Diabetes Type 2"
    }
  ];

  useEffect(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [searchQuery, statusFilter, patients]);

  const handleRefresh = () => {
    fetchPatients();
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      setUpdating(true);
      await patientsAPI.deletePatient(id);
      setPatients(patients.filter(patient => patient._id !== id));
      setSuccessMessage("Patient deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting patient:", error);
      setError("Failed to delete patient");
    } finally {
      setUpdating(false);
    }
  };

  const handleFormSave = async (patientData) => {
    try {
      setUpdating(true);
      setError("");
      
      if (editingPatient) {
        // Update patient
        const response = await patientsAPI.updatePatient(editingPatient._id, patientData);
        if (response.success) {
          setPatients(patients.map(patient => 
            patient._id === editingPatient._id ? response.data : patient
          ));
          setSuccessMessage("Patient updated successfully");
        }
      } else {
        // Create patient
        const response = await patientsAPI.createPatient(patientData);
        if (response.success) {
          setPatients([...patients, response.data]);
          setSuccessMessage("Patient created successfully");
        }
      }
      setIsFormOpen(false);
      setEditingPatient(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving patient:", error);
      setError("Failed to save patient: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPatient(null);
    setError("");
  };

  const getStatusColor = (status) => {
    return status === "Active" 
      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage patient records and information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="mt-4 lg:mt-0 px-4 py-2 bg-white dark:text-zinc-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button 
            onClick={handleAddPatient}
            className="mt-4 lg:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients by name, MRN, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading patients...</span>
          </div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No patients found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? "Try adjusting your search criteria" 
                : "No patients in the system yet"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{patient.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{patient.mrn}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{patient.age} years • {patient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{patient.address}</span>
                  </div>
                  {patient.bloodGroup && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span>Blood Group: {patient.bloodGroup}</span>
                    </div>
                  )}
                  {patient.createdAt && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {formatDate(patient.createdAt)}</span>
                    </div>
                  )}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {patient.allergies.slice(0, 2).map((allergy, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs">
                          {allergy}
                        </span>
                      ))}
                      {patient.allergies.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          +{patient.allergies.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditPatient(patient)}
                      disabled={updating}
                      className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePatient(patient._id)}
                      disabled={updating}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Form Modal */}
      {isFormOpen && (
        <PatientForm
          patient={editingPatient}
          onSave={handleFormSave}
          onClose={handleFormClose}
          loading={updating}
        />
      )}
    </div>
  );
};

export default AdminPatients;
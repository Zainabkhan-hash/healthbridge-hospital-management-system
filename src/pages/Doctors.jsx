import React, { useState, useEffect } from "react";
import { Search, Plus, Mail, Phone, MapPin, Star, Edit, Trash2, UserPlus, Loader2 } from "lucide-react";
import { doctorsAPI } from "../services/api";
import { useSelector } from "react-redux";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const [apiLoading, setApiLoading] = useState(false);

  // Fetch doctors from backend
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await doctorsAPI.getDoctors({ limit: 50 });
      
      if (response.success) {
        const doctorsData = response.data || response;
        setDoctors(Array.isArray(doctorsData) ? doctorsData : [doctorsData]);
        setFilteredDoctors(Array.isArray(doctorsData) ? doctorsData : [doctorsData]);
      } else {
        setError(response.message || "Failed to fetch doctors");
        // Fallback data
        const fallbackDoctors = getFallbackDoctors();
        setDoctors(fallbackDoctors);
        setFilteredDoctors(fallbackDoctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("Failed to load doctors. Please try again.");
      const fallbackDoctors = getFallbackDoctors();
      setDoctors(fallbackDoctors);
      setFilteredDoctors(fallbackDoctors);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDoctors = () => [
    {
      _id: "1",
      name: "Dr. Ahmed Khan",
      specialization: "Cardiologist",
      email: "ahmed.khan@healthbridge.com",
      phone: "+92 300 1234567",
      address: "Medical Center, Karachi",
      experience: 15,
      qualification: "MBBS, FCPS",
      licenseNumber: "PMC-12345",
      consultationFee: 1500,
      status: "Available",
      totalEarnings: 125000
    },
    {
      _id: "2",
      name: "Dr. Sara Ahmed",
      specialization: "Pediatrician",
      email: "sara.ahmed@healthbridge.com",
      phone: "+92 301 2345678",
      address: "Children Hospital, Lahore",
      experience: 12,
      qualification: "MBBS, DCH",
      licenseNumber: "PMC-12346",
      consultationFee: 1200,
      status: "Available",
      totalEarnings: 98000
    },
  ];

  // Filter doctors based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const handleCreateDoctor = () => {
    // This would open a doctor creation form
    alert("Doctor creation feature would open here");
  };

  const handleEditDoctor = async (doctorId) => {
    // Implement edit doctor functionality
    console.log("Edit doctor:", doctorId);
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        setApiLoading(true);
        await doctorsAPI.deleteDoctor(doctorId);
        setDoctors(doctors.filter(doctor => doctor._id !== doctorId));
        setFilteredDoctors(filteredDoctors.filter(doctor => doctor._id !== doctorId));
      } catch (error) {
        console.error("Error deleting doctor:", error);
        setError("Failed to delete doctor. Please try again.");
      } finally {
        setApiLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'Busy': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'On Leave': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  const calculateRating = (doctor) => {
    // Simple rating calculation based on experience and earnings
    const baseRating = 4.0;
    const experienceBonus = Math.min((doctor.experience || 0) * 0.02, 0.5);
    const earningsBonus = Math.min(((doctor.totalEarnings || 0) / 100000) * 0.3, 0.5);
    return (baseRating + experienceBonus + earningsBonus).toFixed(1);
  };

  const calculatePatients = (doctor) => {
    // Estimate patients based on earnings and consultation fee
    return Math.round(((doctor.totalEarnings || 0) / (doctor.consultationFee || 1500)) * 0.8);
  };

  const handleRefresh = () => {
    fetchDoctors();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Doctors Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage medical staff and specialists</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="mt-4 lg:mt-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          {userInfo?.role === 'admin' && (
            <button 
              onClick={handleCreateDoctor}
              className="mt-4 lg:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search doctors by name, specialization, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading doctors...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredDoctors.map((doctor) => {
            const rating = calculateRating(doctor);
            const patientCount = calculatePatients(doctor);
            
            return (
              <div key={doctor._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Header */}
                <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                        {doctor.name?.split(' ').map(n => n[0]).join('') || 'DR'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{doctor.name || "Unknown Doctor"}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialization || "General Practitioner"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{doctor.qualification || "MBBS"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doctor.status)}`}>
                      {doctor.status || "Available"}
                    </span>
                  </div>
                  
                  {/* Rating and Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="font-medium text-gray-900 dark:text-white">{rating}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-400">{doctor.experience || 0} years</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-400">{patientCount} patients</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="p-4 lg:p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{doctor.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{doctor.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-1">{doctor.address || "No address"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      PKR {doctor.consultationFee || "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">License:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{doctor.licenseNumber || "Not provided"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 lg:p-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 font-medium text-sm">
                      View Profile
                    </button>
                    {userInfo?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditDoctor(doctor._id)}
                          disabled={apiLoading}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDoctor(doctor._id)}
                          disabled={apiLoading}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No doctors found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
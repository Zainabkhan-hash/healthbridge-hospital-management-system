import React, { useState, useEffect } from "react";
import { Search, Calendar, Clock, User, MapPin, Video, Phone, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";
import { appointmentsAPI } from "../../services/api";
import { useSelector } from "react-redux";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("today");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialFilterApplied, setIsInitialFilterApplied] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await appointmentsAPI.getDoctorAppointments();
      
      if (response.success) {
        const appointmentsData = response.data || response;
        const mappedAppointments = Array.isArray(appointmentsData) ? appointmentsData.map(apt => ({
          _id: apt._id,
          patient: {
            name: apt.patientID?.name || apt.patientName || "Unknown Patient",
            mrn: apt.patientID?.mrn || apt.patientMRN || "N/A",
            phone: apt.patientID?.phone || apt.patientPhone || "N/A",
            age: apt.patientID?.age || apt.patientAge || "N/A",
            gender: apt.patientID?.gender || apt.patientGender || "Unknown",
            email: apt.patientID?.email || apt.patientEmail || "",
            address: apt.patientID?.address || ""
          },
          appointmentDate: apt.appointmentDate || apt.date,
          appointmentTime: apt.appointmentTime || apt.time,
          type: apt.type || "Consultation",
          status: apt.status || "scheduled",
          duration: apt.duration || "30 mins",
          location: apt.location || "Clinic",
          reason: apt.reason || apt.notes || "Follow-up",
          consultationFee: apt.consultationFee || 1500,
          paymentStatus: apt.paymentStatus || "pending",
          doctorID: apt.doctorID
        })) : [];
        
        setAppointments(mappedAppointments);
        applyFilter(mappedAppointments, "today", "");
      } else {
        setError(response.message || "Failed to fetch appointments");
        const fallbackAppointments = getFallbackAppointments();
        setAppointments(fallbackAppointments);
        applyFilter(fallbackAppointments, "today", "");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again.");
      const fallbackAppointments = getFallbackAppointments();
      setAppointments(fallbackAppointments);
      applyFilter(fallbackAppointments, "today", "");
    } finally {
      setLoading(false);
      setIsInitialFilterApplied(true);
    }
  };

  const getFallbackAppointments = () => [
    {
      _id: "1",
      patient: { name: "Ali Khan", mrn: "MRN001", phone: "+92 300 1234567", age: 45, gender: "Male" },
      appointmentDate: new Date().toISOString(),
      appointmentTime: "10:00 AM",
      type: "Consultation",
      status: "confirmed",
      duration: "30 mins",
      location: "Room 201",
      reason: "Heart checkup and follow-up",
      consultationFee: 1500,
      paymentStatus: "paid"
    },
    {
      _id: "2",
      patient: { name: "Sara Ahmed", mrn: "MRN002", phone: "+92 301 2345678", age: 32, gender: "Female" },
      appointmentDate: new Date().toISOString(),
      appointmentTime: "11:30 AM",
      type: "Follow-up",
      status: "confirmed",
      duration: "45 mins",
      location: "Video Call",
      reason: "Blood pressure medication review",
      consultationFee: 1200,
      paymentStatus: "paid"
    },
    {
      _id: "3",
      patient: { name: "Ahmed Raza", mrn: "MRN003", phone: "+92 302 3456789", age: 58, gender: "Male" },
      appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      appointmentTime: "09:00 AM",
      type: "Consultation",
      status: "scheduled",
      duration: "60 mins",
      location: "Room 201",
      reason: "New patient consultation",
      consultationFee: 2000,
      paymentStatus: "pending"
    }
  ];

  const applyFilter = (appointmentsList, filter, query) => {
    let filtered = appointmentsList;

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "today") {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
    } else if (filter === "upcoming") {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate > today;
      });
    } else if (filter === "past") {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate < today;
      });
    } else if (filter === "cancelled") {
      filtered = filtered.filter(apt => apt.status === 'cancelled');
    }

    // Search filter
    if (query.trim() !== "") {
      filtered = filtered.filter(apt =>
        apt.patient.name.toLowerCase().includes(query.toLowerCase()) ||
        apt.patient.mrn.toLowerCase().includes(query.toLowerCase()) ||
        (apt.type && apt.type.toLowerCase().includes(query.toLowerCase())) ||
        (apt.reason && apt.reason.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    if (isInitialFilterApplied) {
      applyFilter(appointments, selectedFilter, searchQuery);
    }
  }, [selectedFilter, searchQuery, appointments, isInitialFilterApplied]);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const handleRefresh = () => {
    fetchAppointments();
  };

  const filters = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
    { key: "all", label: "All Appointments" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
    }
  };

  const getTypeIcon = (location) => {
    if (!location) return <MapPin className="w-4 h-4" />;
    if (location.toLowerCase().includes("video")) return <Video className="w-4 h-4" />;
    if (location.toLowerCase().includes("phone")) return <Phone className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setUpdating(true);
      setError("");
      setSuccessMessage("");
      
      const response = await appointmentsAPI.updateAppointmentStatus(appointmentId, newStatus);
      if (response.success) {
        setSuccessMessage(`Appointment ${newStatus} successfully`);
        
        // Update local state
        const updatedAppointments = appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: newStatus }
            : apt
        );
        setAppointments(updatedAppointments);
        applyFilter(updatedAppointments, selectedFilter, searchQuery);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(response.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError(error.message || "Failed to update appointment status");
    } finally {
      setUpdating(false);
    }
  };

  const handleReschedule = (appointmentId) => {
    // You can implement reschedule modal/functionality here
    console.log("Reschedule appointment:", appointmentId);
    alert("Reschedule functionality - to be implemented");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || "N/A";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your appointment schedule</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="mt-4 lg:mt-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedFilter === filter.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search appointments by patient name, MRN, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-400">Loading appointments...</span>
            </div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No appointments found</p>
              <p className="text-sm mt-1">
                {searchQuery || selectedFilter !== 'all' 
                  ? "Try adjusting your search criteria" 
                  : "You don't have any appointments scheduled"}
              </p>
            </div>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {appointment.patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{appointment.patient.name}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.patient.age} yrs • {appointment.patient.gender}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {appointment.patient.mrn} • {appointment.type}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(appointment.appointmentTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{appointment.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          {getTypeIcon(appointment.location)}
                          <span>{appointment.location}</span>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            <strong>Fee:</strong> PKR {appointment.consultationFee || "N/A"}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            appointment.paymentStatus === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {appointment.paymentStatus?.toUpperCase() || "PENDING"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions - Doctor can Confirm, Complete, Cancel, and Reschedule */}
                {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {appointment.status === 'scheduled' && (
                      <button 
                        onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                        disabled={updating}
                        className="flex-1 min-w-[120px] py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Confirm
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusChange(appointment._id, 'completed')}
                      disabled={updating}
                      className="flex-1 min-w-[120px] py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Complete
                    </button>
                    <button 
                      onClick={() => handleReschedule(appointment._id)}
                      disabled={updating}
                      className="flex-1 min-w-[120px] py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Reschedule
                    </button>
                    <button 
                      onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                      disabled={updating}
                      className="flex-1 min-w-[120px] py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
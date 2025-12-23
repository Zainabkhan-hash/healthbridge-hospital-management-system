import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Calendar, Clock, User, MapPin, Video, Phone, Search, Loader2, XCircle } from "lucide-react";
import { appointmentsAPI, patientsAPI } from "../../services/api";

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isInitialFilterApplied, setIsInitialFilterApplied] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await appointmentsAPI.getMyAppointments();
      if (response.success) {
        setAppointments(response.data || []);
        applyFilter(response.data || [], "upcoming", "");
      } else {
        setAppointments([]);
        setError(response.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error(error);
      setAppointments([]);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
      setIsInitialFilterApplied(true);
    }
  };

  const applyFilter = (appointmentsList, filter, query) => {
    let filtered = appointmentsList;

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
      });
    } else if (filter === "past") {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate < today || apt.status === 'completed';
      });
    } else if (filter === "cancelled") {
      filtered = filtered.filter(apt => apt.status === 'cancelled');
    }

    // Search filter
    if (query.trim() !== "") {
      filtered = filtered.filter(apt =>
        apt.doctorID?.name?.toLowerCase().includes(query.toLowerCase()) ||
        apt.type?.toLowerCase().includes(query.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(query.toLowerCase())
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

  const filters = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "cancelled", label: "Cancelled" },
    { key: "all", label: "All Appointments" },
  ];

  const handleCancel = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      setUpdating(true);
      setError("");
      setSuccessMessage("");
      
      const response = await patientsAPI.updateAppointmentStatus(appointmentId, 'cancelled');
      if (response.success) {
        setSuccessMessage("Appointment cancelled successfully");
        
        // Update local state
        const updatedAppointments = appointments.map(apt => 
          apt._id === appointmentId 
            ? { ...apt, status: 'cancelled' }
            : apt
        );
        setAppointments(updatedAppointments);
        applyFilter(updatedAppointments, selectedFilter, searchQuery);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(response.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError("Error cancelling appointment");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
    }
  };

  const getTypeIcon = (location) => {
    if (location?.includes("Video")) return <Video className="w-4 h-4" />;
    if (location?.includes("Phone")) return <Phone className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hourStr, minuteStr] = timeString.includes(":") ? timeString.split(":") : ["0", "0"];
    let hour = parseInt(hourStr);
    let minute = parseInt(minuteStr);
    let ampm = "AM";

    if (timeString.toUpperCase().includes("PM") && hour < 12) hour += 12;
    if (hour >= 12) {
      ampm = "PM";
      if (hour > 12) hour -= 12;
    }

    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            My Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track your medical appointments
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="mt-4 lg:mt-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:text-zinc-50 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search appointments by doctor name, type, or reason..."
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
          filteredAppointments.map((apt) => (
            <div key={apt._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                    {apt.doctorID?.name?.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {apt.doctorID?.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                        {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                      </span>
                      {apt.paymentStatus && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          apt.paymentStatus === "paid"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                          {apt.paymentStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {apt.doctorID?.specialization} • {apt.type}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(apt.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(apt.appointmentTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{apt.duration || "30 mins"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(apt.location)}
                        <span>{apt.location}</span>
                      </div>
                    </div>

                    {apt.reason && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                        <strong>Reason:</strong> {apt.reason}
                      </div>
                    )}

                    {apt.consultationFee && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            <strong>Fee:</strong> PKR {apt.consultationFee}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions - Only show cancel for scheduled/confirmed appointments */}
                {(apt.status === "scheduled" || apt.status === "confirmed") && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleCancel(apt._id)}
                      disabled={updating}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Cancel Appointment
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

export default PatientAppointments;
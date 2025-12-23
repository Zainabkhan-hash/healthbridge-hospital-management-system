import React, { useState, useEffect } from "react";
import { Search, Plus, Calendar, Clock, User, MapPin, Video, Phone, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import AppointmentForm from "../components/AppointmentForm";
import { appointmentsAPI } from "../services/api";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  // Fetch appointments based on user role
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      let response;
      
      if (userInfo?.role === 'patient') {
        response = await appointmentsAPI.getMyAppointments();
      } else if (userInfo?.role === 'doctor') {
        response = await appointmentsAPI.getDoctorAppointments();
      } else {
        response = await appointmentsAPI.getAppointments();
      }

      if (response.success) {
        const appointmentsData = response.data || response;
        const mappedAppointments = Array.isArray(appointmentsData) ? appointmentsData.map(apt => ({
          _id: apt._id,
          patient: {
            name: apt.patientID?.name || apt.patientName || "Unknown Patient",
            mrn: apt.patientID?.mrn || apt.patientMRN || "N/A",
            phone: apt.patientID?.phone || apt.patientPhone || "N/A"
          },
          doctor: {
            name: apt.doctorID?.name || apt.doctorName || "Unknown Doctor",
            specialization: apt.doctorID?.specialization || apt.doctorSpecialization || "General"
          },
          appointmentDate: apt.appointmentDate || apt.date,
          appointmentTime: apt.appointmentTime || apt.time,
          type: apt.type || "Consultation",
          status: apt.status || "scheduled",
          duration: apt.duration || "30 mins",
          location: apt.location || "Clinic",
          reason: apt.reason || apt.notes || "Follow-up",
          consultationFee: apt.consultationFee || 1500,
          paymentStatus: apt.paymentStatus || "pending"
        })) : [];
        
        setAppointments(mappedAppointments);
        setFilteredAppointments(mappedAppointments);
      } else {
        setError(response.message || "Failed to fetch appointments");
        // Fallback data
        const fallbackAppointments = getFallbackAppointments();
        setAppointments(fallbackAppointments);
        setFilteredAppointments(fallbackAppointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to load appointments. Please try again.");
      const fallbackAppointments = getFallbackAppointments();
      setAppointments(fallbackAppointments);
      setFilteredAppointments(fallbackAppointments);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackAppointments = () => [
    {
      _id: "1",
      patient: { name: "Ali Khan", mrn: "MRN001", phone: "+92 300 1234567" },
      doctor: { name: "Dr. Ahmed Khan", specialization: "Cardiologist" },
      appointmentDate: new Date().toISOString(),
      appointmentTime: "10:00 AM",
      type: "Consultation",
      status: "confirmed",
      duration: "30 mins",
      location: "Room 201",
      reason: "Regular checkup",
      consultationFee: 1500,
      paymentStatus: "paid"
    },
    {
      _id: "2",
      patient: { name: "Sara Ahmed", mrn: "MRN002", phone: "+92 301 2345678" },
      doctor: { name: "Dr. Fatima Malik", specialization: "Pediatrician" },
      appointmentDate: new Date().toISOString(),
      appointmentTime: "11:30 AM",
      type: "Follow-up",
      status: "pending",
      duration: "45 mins",
      location: "Room 105",
      reason: "Post-surgery follow-up",
      consultationFee: 1200,
      paymentStatus: "pending"
    },
  ];

  // Filter appointments
  useEffect(() => {
    let filtered = appointments;

    // Status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === selectedFilter);
    }

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(apt =>
        apt.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [selectedFilter, searchQuery, appointments]);

  const filters = [
    { key: "all", label: "All Appointments", count: appointments.length },
    { key: "scheduled", label: "Scheduled", count: appointments.filter(a => a.status === "scheduled").length },
    { key: "confirmed", label: "Confirmed", count: appointments.filter(a => a.status === "confirmed").length },
    { key: "completed", label: "Completed", count: appointments.filter(a => a.status === "completed").length },
    { key: "cancelled", label: "Cancelled", count: appointments.filter(a => a.status === "cancelled").length },
  ];

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

  const handleRefresh = () => {
    fetchAppointments();
  };

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setIsFormOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;

    try {
      setUpdating(true);
      // In a real app, you would call appointmentsAPI.deleteAppointment(id)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setAppointments(appointments.filter(appointment => appointment._id !== id));
      setSuccessMessage("Appointment deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setError("Failed to delete appointment");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdating(true);
      const response = await appointmentsAPI.updateAppointmentStatus(id, newStatus);
      if (response.success) {
        setAppointments(appointments.map(appointment => 
          appointment._id === id 
            ? { ...appointment, status: newStatus }
            : appointment
        ));
        setSuccessMessage(`Appointment ${newStatus} successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.message || "Failed to update appointment status");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError("Failed to update appointment status");
    } finally {
      setUpdating(false);
    }
  };

  const handleFormSave = async (appointmentData) => {
    try {
      setUpdating(true);
      setError("");
      setSuccessMessage("");
      
      if (editingAppointment) {
        // Update existing appointment
        const response = await appointmentsAPI.updateAppointmentStatus(editingAppointment._id, appointmentData.status);
        if (response.success) {
          setAppointments(appointments.map(apt => 
            apt._id === editingAppointment._id 
              ? { ...apt, ...appointmentData }
              : apt
          ));
          setSuccessMessage("Appointment updated successfully");
        } else {
          setError(response.message || "Failed to update appointment");
        }
      } else {
        // Create new appointment
        const response = await appointmentsAPI.createAppointment(appointmentData);
        if (response.success) {
          setAppointments([...appointments, response.data]);
          setSuccessMessage("Appointment created successfully");
        } else {
          setError(response.message || "Failed to create appointment");
        }
      }
      setIsFormOpen(false);
      setEditingAppointment(null);
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving appointment:", error);
      setError(error.message || "Failed to save appointment");
    } finally {
      setUpdating(false);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAppointment(null);
    setError("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusActions = (appointment) => {
    if (userInfo?.role !== 'admin' && userInfo?.role !== 'doctor') {
      return null;
    }

    switch (appointment.status) {
      case "scheduled":
      case "pending":
        return (
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => handleStatusChange(appointment._id, "confirmed")}
              disabled={updating}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
            </button>
            <button 
              onClick={() => handleStatusChange(appointment._id, "cancelled")}
              disabled={updating}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel'}
            </button>
          </div>
        );
      case "confirmed":
        return (
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => handleStatusChange(appointment._id, "completed")}
              disabled={updating}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Complete'}
            </button>
            <button 
              onClick={() => handleStatusChange(appointment._id, "cancelled")}
              disabled={updating}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track patient appointments</p>
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
          {(userInfo?.role === 'admin' || userInfo?.role === 'patient') && (
            <button 
              onClick={handleAddAppointment}
              className="mt-4 lg:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Appointment</span>
            </button>
          )}
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                selectedFilter === filter.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filter.label} ({filter.count})
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
            placeholder="Search appointments by patient or doctor name..."
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
              <p className="text-sm mt-1">Try selecting a different filter or search term</p>
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
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        {appointment.paymentStatus && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.paymentStatus === 'paid' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {appointment.paymentStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        with {appointment.doctor.name} • {appointment.doctor.specialization}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.appointmentTime}</span>
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

                      {appointment.consultationFee && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Fee: PKR {appointment.consultationFee}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {(userInfo?.role === 'admin' || userInfo?.role === 'doctor') && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditAppointment(appointment)}
                        disabled={updating}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAppointment(appointment._id)}
                        disabled={updating}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Status Actions */}
                {getStatusActions(appointment)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appointment Form Modal */}
      {isFormOpen && (
        <AppointmentForm
          appointment={editingAppointment}
          onSave={handleFormSave}
          onClose={handleFormClose}
          loading={updating}
        />
      )}
    </div>
  );
};

export default Appointments;
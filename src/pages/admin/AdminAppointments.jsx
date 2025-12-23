import React, { useState, useEffect } from "react";
import { Search, Plus, Calendar, Clock, User, MapPin, Video, Phone, MoreVertical, Edit, Trash2, Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { appointmentsAPI } from "../../services/api";
import AppointmentForm from "../../components/AppointmentForm";
import { useSelector } from "react-redux";

const AdminAppointments = () => {
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("🔄 Fetching appointments...");
      const response = await appointmentsAPI.getAppointments();
      console.log("📦 Appointments response:", response);
      
      if (response && response.success) {
        const appointmentsData = response.data;
        console.log("✅ Appointments data:", appointmentsData);
        
        const mappedAppointments = Array.isArray(appointmentsData) ? appointmentsData.map(apt => ({
          _id: apt._id,
          patient: {
            name: apt.patientID?.name || "Unknown Patient",
            mrn: apt.patientID?.mrn || "N/A",
            phone: apt.patientID?.phone || "N/A"
          },
          doctor: {
            name: apt.doctorID?.name || "Unknown Doctor",
            specialization: apt.doctorID?.specialization || "General"
          },
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          type: apt.type || "Consultation",
          status: apt.status || "scheduled",
          duration: apt.duration || "30 mins",
          location: apt.location || "Clinic",
          reason: apt.reason || "Follow-up",
          consultationFee: apt.consultationFee || apt.doctorID?.consultationFee || 1500,
          paymentStatus: apt.paymentStatus || "pending"
        })) : [];
        
        if (mappedAppointments.length === 0) {
          console.warn("⚠️ No appointments found in the response");
        }
        
        setAppointments(mappedAppointments);
        setFilteredAppointments(mappedAppointments);
      } else {
        const errorMsg = response?.message || "Failed to fetch appointments";
        console.error("❌ API returned success: false", response);
        setError(errorMsg);
      }
    } catch (error) {
      console.error("💥 Error fetching appointments:", error);
      setError(`Failed to load appointments: ${error.message}`);
    } finally {
      setLoading(false);
      console.log("✅ Fetch complete");
    }
  };

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
      await appointmentsAPI.deleteAppointment(id);
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
      setError("");
      setSuccessMessage("");
      
      const response = await appointmentsAPI.updateAppointmentStatus(id, newStatus);
      if (response.success) {
        // Update local state with new status and payment status if completed
        const updatedAppointments = appointments.map(appointment => {
          if (appointment._id === id) {
            const updated = { ...appointment, status: newStatus };
            if (newStatus === 'completed') {
              updated.paymentStatus = 'paid';
            }
            return updated;
          }
          return appointment;
        });
        
        setAppointments(updatedAppointments);
        setSuccessMessage(`Appointment ${newStatus} successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError(error.message || "Failed to update appointment status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleReschedule = (appointment) => {
    // Open form with appointment data for rescheduling
    setEditingAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleFormSave = async (appointmentData) => {
    try {
      setUpdating(true);
      if (editingAppointment) {
        // Update appointment status
        const response = await appointmentsAPI.updateAppointmentStatus(editingAppointment._id, appointmentData.status);
        if (response.success) {
          setAppointments(appointments.map(apt => 
            apt._id === editingAppointment._id 
              ? { ...apt, ...appointmentData }
              : apt
          ));
          setSuccessMessage("Appointment updated successfully");
        }
      } else {
        // Create appointment
        const response = await appointmentsAPI.createAppointment(appointmentData);
        if (response.success) {
          setAppointments([...appointments, response.data]);
          setSuccessMessage("Appointment created successfully");
        }
      }
      setIsFormOpen(false);
      setEditingAppointment(null);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error("Error saving appointment:", error);
      setError("Failed to save appointment");
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all patient appointments</p>
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
            onClick={handleAddAppointment}
            className="mt-4 lg:mt-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Appointment</span>
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
              <p className="text-sm mt-1">
                {appointments.length === 0 
                  ? "No appointments in the system yet. Create one to get started!"
                  : "Try selecting a different filter or search term"}
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
                      {appointment.patient.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
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
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              <strong>Fee:</strong> PKR {appointment.consultationFee}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditAppointment(appointment)}
                      disabled={updating}
                      className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAppointment(appointment._id)}
                      disabled={updating}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Status Actions */}
                {(appointment.status === 'scheduled' || appointment.status === 'confirmed' || appointment.status === 'pending') && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                      disabled={updating || appointment.status === 'confirmed'}
                      className="flex-1 min-w-[100px] py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirm
                    </button>
                    <button 
                      onClick={() => handleStatusChange(appointment._id, 'completed')}
                      disabled={updating || appointment.status === 'completed'}
                      className="flex-1 min-w-[100px] py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Complete
                    </button>
                    <button 
                      onClick={() => handleReschedule(appointment)}
                      disabled={updating}
                      className="flex-1 min-w-[100px] py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Reschedule
                    </button>
                    <button 
                      onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                      disabled={updating || appointment.status === 'cancelled'}
                      className="flex-1 min-w-[100px] py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
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

export default AdminAppointments;
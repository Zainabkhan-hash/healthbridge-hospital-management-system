import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, MapPin, Stethoscope } from "lucide-react";
import { patientsAPI, doctorsAPI } from "../services/api";

const AppointmentForm = ({ appointment, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    appointmentDate: "",
    appointmentTime: "",
    type: "Consultation",
    duration: "30 mins",
    location: "Room 201",
    reason: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch patients and doctors
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientsAPI.getPatients({ limit: 100 });
      if (response.success) setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getDoctors();
      if (response.success) setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (appointment) {
      setFormData({
        patient: appointment.patient?._id || appointment.patient || "",
        doctor: appointment.doctor?._id || appointment.doctor || "",
        appointmentDate: appointment.appointmentDate
          ? new Date(appointment.appointmentDate)
              .toISOString()
              .split("T")[0]
          : "",
        appointmentTime: appointment.appointmentTime || "",
        type: appointment.type || "Consultation",
        duration: appointment.duration || "30 mins",
        location: appointment.location || "Room 201",
        reason: appointment.reason || "",
        notes: appointment.notes || ""
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, appointmentDate: today }));
    }
  }, [appointment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient) newErrors.patient = "Patient is required";
    if (!formData.doctor) newErrors.doctor = "Doctor is required";
    if (!formData.appointmentDate) newErrors.appointmentDate = "Date is required";
    if (!formData.appointmentTime) newErrors.appointmentTime = "Time is required";
    if (!formData.reason.trim()) newErrors.reason = "Reason is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      try {
        await onSave(formData);
      } catch (error) {
        console.error("Error saving appointment:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const appointmentTypes = [
    "Consultation",
    "Follow-up",
    "Checkup",
    "Emergency",
    "Surgery",
    "Therapy"
  ];

  const locations = [
    "Room 201",
    "Room 105",
    "Room 301",
    "Emergency Room",
    "Operation Theater",
    "Video Call",
    "Phone Call"
  ];

  const durationOptions = ["30 mins", "45 mins", "60 mins", "90 mins", "120 mins"];

  // FIXED: time values now use "HH:mm" for matching DB
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const value = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        const display = `${hour > 12 ? hour - 12 : hour}:${minute
          .toString()
          .padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

        slots.push({ value, display });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {appointment ? "Edit Appointment" : "New Appointment"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {appointment
                ? "Update appointment details"
                : "Schedule a new appointment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Patient */}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <select
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl ${
                  errors.patient
                    ? "border-red-300 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <option value="">Select Patient *</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.mrn})
                  </option>
                ))}
              </select>
              {errors.patient && <p className="text-red-500 text-xs mt-1">{errors.patient}</p>}
            </div>

            {/* Doctor */}
            <div className="relative">
              <Stethoscope className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl ${
                  errors.doctor
                    ? "border-red-300 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <option value="">Select Doctor *</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} - {d.specialization}
                  </option>
                ))}
              </select>
              {errors.doctor && <p className="text-red-500 text-xs mt-1">{errors.doctor}</p>}
            </div>

            {/* Appointment Type */}
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl"
            >
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl ${
                  errors.appointmentDate
                    ? "border-red-300 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              />
              {errors.appointmentDate && (
                <p className="text-red-500 text-xs mt-1">{errors.appointmentDate}</p>
              )}
            </div>

            {/* Time */}
            <div className="relative">
              <Clock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <select
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl ${
                  errors.appointmentTime
                    ? "border-red-300 dark:border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <option value="">Select Time *</option>
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.display}
                  </option>
                ))}
              </select>
              {errors.appointmentTime && (
                <p className="text-red-500 text-xs mt-1">{errors.appointmentTime}</p>
              )}
            </div>

            {/* Duration */}
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl"
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Location */}
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <textarea
            name="reason"
            rows="3"
            value={formData.reason}
            placeholder="Reason for appointment *"
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl resize-none ${
              errors.reason
                ? "border-red-300 dark:border-red-500"
                : "border-gray-200 dark:border-gray-600"
            }`}
          />
          {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}

          {/* Notes */}
          <textarea
            name="notes"
            rows="2"
            value={formData.notes}
            placeholder="Additional notes (optional)"
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl resize-none"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {loading ? "Saving..." : appointment ? "Update Appointment" : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;

import React, { useState, useEffect } from "react";
import { X, Upload, User, Phone, Mail, MapPin, Calendar, Hash, Droplets, AlertTriangle } from "lucide-react";
import { patientsAPI } from "../services/api";

const PatientForm = ({ patient, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    age: "",
    phone: "",
    email: "",
    cnic: "",
    gender: "Male",
    address: "",
    bloodGroup: "",
    emergencyContact: "",
    allergies: "",
    medicalHistory: ""
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : "",
        age: patient.age?.toString() || "",
        phone: patient.phone || "",
        email: patient.email || "",
        cnic: patient.cnic || "",
        gender: patient.gender || "Male",
        address: patient.address || "",
        bloodGroup: patient.bloodGroup || "",
        emergencyContact: patient.emergencyContact || "",
        allergies: patient.allergies?.join(', ') || "",
        medicalHistory: patient.medicalHistory || ""
      });
    }
  }, [patient]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Remove error if corrected
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // File selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Calculate age from DOB
  const handleAgeFromDob = (dob) => {
    if (!dob) return;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    setFormData(prev => ({ ...prev, age: age.toString(), dob }));
  };

  // Calculate DOB from age
  const handleDobFromAge = (age) => {
    if (!age) return;
    const today = new Date();
    const birthYear = today.getFullYear() - parseInt(age);
    const dob = new Date(birthYear, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, dob, age: age.toString() }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (formData.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+92\s\d{3}\s\d{7}$/.test(formData.phone)) newErrors.phone = "Phone must be in format: +92 XXX XXXXXXX";
    
    if (!formData.cnic.trim()) newErrors.cnic = "CNIC is required";
    else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) newErrors.cnic = "CNIC must be in format: XXXXX-XXXXXXX-X";
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.age) newErrors.age = "Age is required";
    else if (parseInt(formData.age) < 0 || parseInt(formData.age) > 120) newErrors.age = "Age must be between 0 and 120";
    
    if (!formData.address.trim()) newErrors.address = "Address is required";
    
    if (formData.emergencyContact && !/^\+92\s\d{3}\s\d{7}$/.test(formData.emergencyContact)) {
      newErrors.emergencyContact = "Emergency contact must be in format: +92 XXX XXXXXXX";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format data for backend
  const formatDataForBackend = () => {
    const formattedData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      cnic: formData.cnic.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      address: formData.address.trim(),
      email: formData.email.trim() || undefined,
      bloodGroup: formData.bloodGroup || undefined,
      emergencyContact: formData.emergencyContact.trim() || undefined,
      medicalHistory: formData.medicalHistory.trim() || undefined
    };

    // Add allergies as array if provided
    if (formData.allergies.trim()) {
      formattedData.allergies = formData.allergies.split(',').map(allergy => allergy.trim()).filter(allergy => allergy);
    }

    // Add DOB if provided
    if (formData.dob) {
      formattedData.dob = new Date(formData.dob).toISOString();
    }

    return formattedData;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formattedData = formatDataForBackend();
      await onSave(formattedData);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {patient ? "Edit Patient" : "Add New Patient"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {patient ? "Update patient information" : "Enter new patient details"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="name"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.name ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* CNIC */}
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="cnic"
                  placeholder="CNIC Number * (XXXXX-XXXXXXX-X)"
                  value={formData.cnic}
                  onChange={handleChange}
                  disabled={loading || !!patient} // CNIC cannot be changed for existing patients
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.cnic ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
              </div>

              {/* Phone */}
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="phone"
                  placeholder="Phone Number * (+92 XXX XXXXXXX)"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.phone ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.email ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* DOB */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="dob"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dob}
                  onChange={(e) => handleAgeFromDob(e.target.value)}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Age */}
              <div className="relative">
                <input
                  name="age"
                  type="number"
                  placeholder="Age *"
                  value={formData.age}
                  onChange={(e) => {
                    handleChange(e);
                    handleDobFromAge(e.target.value);
                  }}
                  min="0"
                  max="120"
                  disabled={loading}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.age ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              {/* Gender */}
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none disabled:opacity-50"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none disabled:opacity-50"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="address"
                placeholder="Full Address *"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                disabled={loading}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 resize-none disabled:opacity-50 ${
                  errors.address ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                }`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Medical Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emergency Contact */}
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="emergencyContact"
                  placeholder="Emergency Contact (+92 XXX XXXXXXX)"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all duration-300 disabled:opacity-50 ${
                    errors.emergencyContact ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact}</p>}
              </div>

              {/* Allergies */}
              <div className="relative">
                <input
                  name="allergies"
                  placeholder="Allergies (comma separated)"
                  value={formData.allergies}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Medical History */}
            <div className="relative">
              <textarea
                name="medicalHistory"
                placeholder="Medical History"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows="3"
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-300">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Drop files here or click to upload medical documents
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-lg transition-colors duration-300 cursor-pointer ${
                loading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Choose Files
            </label>
            {files.length > 0 && (
              <div className="mt-2 flex flex-col md:flex-row items-center justify-between gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {files.length} file(s) selected
                </p>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  disabled={loading}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors duration-300 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {patient ? "Update Patient" : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
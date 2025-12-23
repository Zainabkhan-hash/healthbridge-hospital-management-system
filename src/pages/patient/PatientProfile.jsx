// pages/patient/PatientProfile.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { User, Phone, Mail, MapPin, Calendar, Hash, Droplets, AlertTriangle, Edit, Save, Loader2, Shield } from "lucide-react";
import { patientsAPI } from "../../services/api";

const PatientProfile = () => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await patientsAPI.getMyProfile();
      
      if (response.success) {
        const patientData = response.data || response;
        const formattedPatient = {
          _id: patientData._id || userInfo?.id,
          mrn: patientData.mrn || userInfo?.mrn || 'MRN001',
          name: patientData.name || userInfo?.name || 'Patient',
          age: patientData.age || userInfo?.age || 0,
          gender: patientData.gender || userInfo?.gender || 'Unknown',
          bloodGroup: patientData.bloodGroup || userInfo?.bloodGroup || 'Unknown',
          allergies: patientData.allergies || userInfo?.allergies || [],
          status: patientData.status || 'Active',
          email: patientData.email || userInfo?.email || '',
          phone: patientData.phone || userInfo?.phone || '',
          cnic: patientData.cnic || userInfo?.cnic || '',
          address: patientData.address || userInfo?.address || '',
          emergencyContact: patientData.emergencyContact || userInfo?.emergencyContact || '',
          medicalHistory: patientData.medicalHistory || userInfo?.medicalHistory || '',
          dateOfBirth: patientData.dateOfBirth || userInfo?.dateOfBirth || '',
          maritalStatus: patientData.maritalStatus || userInfo?.maritalStatus || 'Single',
          occupation: patientData.occupation || userInfo?.occupation || '',
          insuranceProvider: patientData.insuranceProvider || userInfo?.insuranceProvider || 'None',
          insuranceNumber: patientData.insuranceNumber || userInfo?.insuranceNumber || '',
          primaryCarePhysician: patientData.primaryCarePhysician || userInfo?.primaryCarePhysician || ''
        };
        
        setPatient(formattedPatient);
        setFormData(formattedPatient);
      } else {
        setError(response.message || "Failed to fetch patient profile");
        // Fallback data
        const fallbackPatient = getFallbackPatient();
        setPatient(fallbackPatient);
        setFormData(fallbackPatient);
      }
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      setError("Failed to load patient profile. Please try again.");
      const fallbackPatient = getFallbackPatient();
      setPatient(fallbackPatient);
      setFormData(fallbackPatient);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPatient = () => ({
    _id: userInfo?.id || '1',
    mrn: userInfo?.mrn || 'MRN001',
    name: userInfo?.name || 'Demo Patient',
    age: userInfo?.age || 35,
    gender: userInfo?.gender || 'Male',
    bloodGroup: userInfo?.bloodGroup || 'O+',
    allergies: userInfo?.allergies || ['Penicillin', 'Dust'],
    status: 'Active',
    email: userInfo?.email || 'patient@demo.com',
    phone: userInfo?.phone || '+92 300 1234567',
    cnic: userInfo?.cnic || '12345-6789012-3',
    address: userInfo?.address || 'House 45, Street 10, G-13/3, Islamabad',
    emergencyContact: userInfo?.emergencyContact || '+92 301 7654321',
    medicalHistory: userInfo?.medicalHistory || 'Hypertension, controlled with medication',
    dateOfBirth: userInfo?.dateOfBirth || '1990-01-01',
    maritalStatus: userInfo?.maritalStatus || 'Married',
    occupation: userInfo?.occupation || 'Software Engineer',
    insuranceProvider: userInfo?.insuranceProvider || 'State Life',
    insuranceNumber: userInfo?.insuranceNumber || 'SL123456789',
    primaryCarePhysician: userInfo?.primaryCarePhysician || 'Dr. Ahmed Khan'
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      
      // Filter out empty values and prepare data for API
      const updateData = Object.keys(formData).reduce((acc, key) => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          acc[key] = formData[key];
        }
        return acc;
      }, {});

      // Update patient profile
      const response = await patientsAPI.updatePatient(patient._id, updateData);
      
      if (response.success) {
        const updatedPatient = response.data || response;
        setPatient(updatedPatient);
        setSuccessMessage("Profile updated successfully");
        setEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating patient profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefresh = () => {
    fetchPatientProfile();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return patient?.age || 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal and medical information</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:text-zinc-50 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editing ? (
              <Save className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
            <span>{saving ? "Saving..." : editing ? "Save Changes" : "Edit Profile"}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
              {patient?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient?.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Patient</p>
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-green-600 dark:text-green-400 font-semibold">{patient?.status}</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">MRN:</span>
                <span className="font-medium text-gray-900 dark:text-white">{patient?.mrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Age:</span>
                <span className="font-medium text-gray-900 dark:text-white">{calculateAge(patient?.dateOfBirth)} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Blood Group:</span>
                <span className="font-medium text-gray-900 dark:text-white">{patient?.bloodGroup}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={patient?.mrn || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white opacity-50 cursor-not-allowed"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Phone Number"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Email Address"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  rows="3"
                  placeholder="Address"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Emergency Contact Number"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <input
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Occupation"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <input
                    name="insuranceProvider"
                    value={formData.insuranceProvider || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Insurance Provider"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    name="insuranceNumber"
                    value={formData.insuranceNumber || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Insurance Policy Number"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medical Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                {editing ? (
                  <textarea
                    name="allergies"
                    value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : formData.allergies || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        allergies: value.split(',').map(item => item.trim()).filter(item => item)
                      }));
                    }}
                    rows="2"
                    placeholder="Enter allergies separated by commas"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient?.allergies?.map((allergy, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
                        {allergy}
                      </span>
                    ))}
                    {(!patient?.allergies || patient.allergies.length === 0) && (
                      <span className="text-gray-500 dark:text-gray-400">No allergies recorded</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={formData.medicalHistory || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  rows="4"
                  placeholder="Medical history, chronic conditions, surgeries, etc."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Care Physician</label>
                <input
                  name="primaryCarePhysician"
                  value={formData.primaryCarePhysician || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Name of primary care physician"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
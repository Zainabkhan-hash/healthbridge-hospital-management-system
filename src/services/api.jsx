const API_URL = 'http://localhost:5000/api';

// Set auth token function
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    console.log("✅ Token saved to localStorage:", token.substring(0, 20) + "...");
  } else {
    localStorage.removeItem('token');
    console.log("🗑️ Token removed from localStorage");
  }
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log("🌐 API Call:", endpoint, config);
    
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    
    console.log("📥 API Response:", data);
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    if (data.success === false) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
};

// Enhanced API call with methods
const apiCallWithMethods = (endpoint, options = {}) => apiCall(endpoint, options);

apiCallWithMethods.get = (endpoint, options = {}) => 
  apiCall(endpoint, { ...options, method: 'GET' });

apiCallWithMethods.post = (endpoint, body, options = {}) => 
  apiCall(endpoint, { ...options, method: 'POST', body });

apiCallWithMethods.put = (endpoint, body, options = {}) => 
  apiCall(endpoint, { ...options, method: 'PUT', body });

apiCallWithMethods.patch = (endpoint, body, options = {}) => 
  apiCall(endpoint, { ...options, method: 'PATCH', body });

apiCallWithMethods.delete = (endpoint, options = {}) => 
  apiCall(endpoint, { ...options, method: 'DELETE' });

// Auth API
export const authAPI = {
  login: (credentials) => apiCallWithMethods.post('/auth/login', credentials),
  registerPatient: (patientData) => apiCallWithMethods.post('/auth/register-patient', patientData),
  createDoctor: (doctorData) => apiCallWithMethods.post('/auth/create-doctor', doctorData),
  getProfile: () => apiCallWithMethods.get('/auth/profile'),
};

// Dashboard API
export const dashboardAPI = {
  getDashboardData: () => apiCallWithMethods.get('/dashboard/data'),
};

// Patients API
// Add this to your patientsAPI in services/api.js
export const patientsAPI = {
  getPatients: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/patients?${queryString}`);
  },
  getPatientById: (id) => apiCallWithMethods.get(`/patients/${id}`),
  getMyProfile: () => apiCallWithMethods.get('/patients/profile/me'),
  updatePatient: (id, data) => apiCallWithMethods.put(`/patients/${id}`, data),
  createPatient: (data) => apiCallWithMethods.post('/patients', data),
  deletePatient: (id) => apiCallWithMethods.delete(`/patients/${id}`),
  getMyAppointments: () => apiCallWithMethods.get('/patients/appointments/me'),
  updateAppointmentStatus: (id, status) => apiCallWithMethods.put(`/patients/appointments/${id}`, { status }), // NEW
  getPatientDashboard: () => apiCallWithMethods.get('/patients/dashboard/data'),
};
// Doctors API
export const doctorsAPI = {
  getDoctors: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/doctors/getalldoctors?${queryString}`);
  },
  getDoctorById: (id) => apiCallWithMethods.get(`/doctors/${id}`),

  createDoctor: (data) => apiCallWithMethods.post('/doctors', data),
  updateDoctor: (id, data) => apiCallWithMethods.put(`/doctors/${id}`, data),
  deleteDoctor: (id) => apiCallWithMethods.delete(`/doctors/${id}`),
};

// Appointments API
export const appointmentsAPI = {
 getAppointments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/appointments?${queryString}` : '/appointments';
    console.log("🌐 API Call URL:", url);
    return apiCallWithMethods.get(url);
  },
  getMyAppointments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/appointments/my-appointments?${queryString}`);
  },
  getDoctorAppointments: () => apiCallWithMethods.get('/appointments/doctor/my-appointments'),
  createAppointment: (data) => apiCallWithMethods.post('/appointments', data),
    updateAppointmentStatus: (id, status) => apiCallWithMethods.put(`/patients/appointments/${id}`, { status }), // ADD THIS
  updatePaymentStatus: (id, paymentStatus) => 
    apiCallWithMethods.patch(`/appointments/${id}/payment-status`, { paymentStatus }),
};

// Prescriptions API
export const prescriptionsAPI = {
  getPrescriptions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/prescriptions?${queryString}`);
  },
  getPrescriptionById: (id) => apiCallWithMethods.get(`/prescriptions/${id}`),
  getMyPrescriptions: () => apiCallWithMethods.get('/prescriptions/my-prescriptions'),
  getPatientPrescriptions: (patientId) => 
    apiCallWithMethods.get(`/prescriptions/patient/${patientId}`),
  createPrescription: (data) => apiCallWithMethods.post('/prescriptions', data),
  updatePrescription: (id, data) => apiCallWithMethods.put(`/prescriptions/${id}`, data),
  deletePrescription: (id) => apiCallWithMethods.delete(`/prescriptions/${id}`),
  requestRefill: (id) => apiCallWithMethods.post(`/prescriptions/${id}/refill`),
};

// Lab Reports API
export const labReportsAPI = {
  getLabReports: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/lab-reports?${queryString}`);
  },
  getLabReportById: (id) => apiCallWithMethods.get(`/lab-reports/${id}`),
  getMyLabReports: () => apiCallWithMethods.get('/lab-reports/my-reports'),
  getPatientLabReports: (patientId) => 
    apiCallWithMethods.get(`/lab-reports/patient/${patientId}`),
  createLabReport: (data) => apiCallWithMethods.post('/lab-reports', data),
  updateLabReport: (id, data) => apiCallWithMethods.put(`/lab-reports/${id}`, data),
  deleteLabReport: (id) => apiCallWithMethods.delete(`/lab-reports/${id}`),
  uploadResult: (id, data) => apiCallWithMethods.put(`/lab-reports/${id}/upload`, data),
};

// Medical Records API
export const medicalRecordsAPI = {
  getMedicalRecords: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCallWithMethods.get(`/medical-records?${queryString}`);
  },
  getMedicalRecordById: (id) => apiCallWithMethods.get(`/medical-records/${id}`),
  getMyRecords: () => apiCallWithMethods.get('/medical-records/my-records'),
  getPatientRecords: (patientId) => 
    apiCallWithMethods.get(`/medical-records/patient/${patientId}`),
  createMedicalRecord: (data) => apiCallWithMethods.post('/medical-records', data),
  updateMedicalRecord: (id, data) => apiCallWithMethods.put(`/medical-records/${id}`, data),
  deleteMedicalRecord: (id) => apiCallWithMethods.delete(`/medical-records/${id}`),
  uploadAttachment: (recordId, data) => 
    apiCallWithMethods.post(`/medical-records/${recordId}/attachments`, data),
};

export default apiCallWithMethods;
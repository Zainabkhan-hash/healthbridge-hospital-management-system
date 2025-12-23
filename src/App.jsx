// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import { setCredentials } from './redux/slices/authSlice';

// Layout Components
import Layout from './layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NavigateToRole from './components/NavigateToRole';

// Auth Pages
import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import Unauthorized from './pages/Unauthorized';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminAppointments from './pages/admin/AdminAppointments'; // ADD THIS IMPORT

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import PatientAppointments from './pages/patient/PatientAppointments';
import MedicalRecords from './pages/patient/MedicalRecords';
import Prescriptions from './pages/patient/Prescriptions';
import LabReports from './pages/patient/LabReports';
import BookDoctors from './pages/patient/BookDoctors';

// Temporary debug component
const DebugAuth = () => {
  const { userInfo, token } = useSelector((state) => state.auth);
  
  console.log('🐛 Debug Auth State:', {
    userInfo,
    token: token ? `${token.substring(0, 20)}...` : null,
    localStorageUser: localStorage.getItem('userInfo'),
    localStorageToken: localStorage.getItem('token')
  });

  return null;
};

function App() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUserInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        
        console.log('🔄 Initializing auth from storage:', {
          hasStoredUser: !!storedUserInfo,
          hasToken: !!token
        });
        
        if (storedUserInfo && token) {
          const userData = JSON.parse(storedUserInfo);
          console.log('📦 Restoring user data:', userData);
          dispatch(setCredentials({ userInfo: userData, token }));
        }
      } catch (error) {
        console.error('❌ Error restoring session:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
        console.log('🏁 Auth initialization complete');
      }
    };

    initializeAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading HealthBridge...</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="mt-4 text-sm text-red-600 hover:text-red-800"
          >
            Clear Storage & Reload
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 App rendering - User Info:', userInfo);

  return (
    <ThemeProvider>
      <DebugAuth />
      <Router>
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!userInfo ? <Login /> : <NavigateToRole />} 
            />
            <Route 
              path="/register" 
              element={!userInfo ? <RegisterPatient /> : <NavigateToRole />} 
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="doctors" element={<AdminDoctors />} />
                    <Route path="appointments" element={<AdminAppointments />} /> {/* ADD THIS LINE */}
                    <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected Doctor Routes */}
            <Route path="/doctor/*" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<DoctorDashboard />} />
                    <Route path="patients" element={<DoctorPatients />} />
                    <Route path="appointments" element={<DoctorAppointments />} />
                    <Route path="" element={<Navigate to="/doctor/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected Patient Routes */}
            <Route path="/patient/*" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout>
                  <Routes>
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="profile" element={<PatientProfile />} />
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="book-doctors" element={<BookDoctors />} />
                    <Route path="records" element={<MedicalRecords />} />
                    <Route path="prescriptions" element={<Prescriptions />} />
                    <Route path="lab-reports" element={<LabReports />} />
                    <Route path="" element={<Navigate to="/patient/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Default Route */}
            <Route path="/" element={
              userInfo ? <NavigateToRole /> : <Navigate to="/login" replace />
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
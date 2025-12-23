// components/NavigateToRole.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const NavigateToRole = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  console.log("🔄 NavigateToRole - User Info:", userInfo);
  
  if (!userInfo) {
    console.log("❌ No user info, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  console.log("✅ User role detected:", userInfo.role);
  
  switch (userInfo.role) {
    case 'admin':
      console.log("➡️ Redirecting admin to /admin/dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    case 'doctor':
      console.log("➡️ Redirecting doctor to /doctor/dashboard");
      return <Navigate to="/doctor/dashboard" replace />;
    case 'patient':
      console.log("➡️ Redirecting patient to /patient/dashboard");
      return <Navigate to="/patient/dashboard" replace />;
    default:
      console.log("❓ Unknown role, redirecting to login");
      return <Navigate to="/login" replace />;
  }
};

export default NavigateToRole;
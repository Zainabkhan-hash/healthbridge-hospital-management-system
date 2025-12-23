// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  
  console.log('🛡️ ProtectedRoute Check:', { 
    hasUser: !!userInfo, 
    userRole: userInfo?.role, 
    allowedRoles 
  });

  // If no user info, redirect to login
  if (!userInfo) {
    console.log('❌ No user info, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(userInfo.role)) {
    console.log('🚫 Role not allowed, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has correct role
  console.log('✅ Access granted for role:', userInfo.role);
  return children;
};

export default ProtectedRoute;
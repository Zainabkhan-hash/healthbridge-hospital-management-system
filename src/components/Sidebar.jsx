// components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Stethoscope, Calendar, Settings, X, User, FileText, Menu, Pill, Activity, Shield } from 'lucide-react';

const Sidebar = ({ isCollapsed = false, onToggle, onClose, isMobile = false }) => {
  // Get user info from localStorage instead of Redux
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  console.log("🔧 Sidebar Props:", { isCollapsed, isMobile, userRole: userInfo?.role, hasOnClose: !!onClose });

  // Menu items based on user role
  const getMenuItems = () => {
    if (!userInfo) {
      return [
        { name: "Login", icon: Home, path: "/login" },
        { name: "Register", icon: User, path: "/register" },
      ];
    }

    const baseItems = [
      { name: "Dashboard", icon: Home, path: `/${userInfo?.role}/dashboard` },
    ];

    if (userInfo?.role === 'admin') {
      return [
        ...baseItems,
        { name: "Doctors", icon: Stethoscope, path: "/admin/doctors" },
        { name: "Appointments", icon: Calendar, path: "/admin/appointments" },
        { name: "Settings", icon: Settings, path: "/admin/settings" },
      ];
    } else if (userInfo?.role === 'doctor') {
      return [
        ...baseItems,
        { name: "Patients", icon: Users, path: "/doctor/patients" },
        { name: "Appointments", icon: Calendar, path: "/doctor/appointments" },
        { name: "Settings", icon: Settings, path: "/doctor/settings" },
      ];
    } else {
      // Patient menu
      return [
        ...baseItems,
        { name: "Profile", icon: User, path: "/patient/profile" },
        { name: "Appointments", icon: Calendar, path: "/patient/appointments" },
        { name: "Book Doctors", icon: Calendar, path: "/patient/book-doctors" },
        { name: "Medical Records", icon: FileText, path: "/patient/records" },
        { name: "Prescriptions", icon: Pill, path: "/patient/prescriptions" },
        { name: "Lab Reports", icon: Activity, path: "/patient/lab-reports" },
      ];
    }
  };

  const menuItems = getMenuItems();

  // Determine which icon to show based on state
  const getToggleIcon = () => {
    if (isMobile) {
      return <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    } else {
      return isCollapsed ? 
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Handle click based on device type
  const handleToggleClick = () => {
    console.log("🖱️ Sidebar toggle clicked - Mobile:", isMobile);
    if (isMobile && onClose) {
      console.log("📱 Calling onClose from toggle button");
      onClose();
    } else if (onToggle) {
      onToggle();
    }
  };

  // Handle navigation click on mobile - FIXED VERSION
  const handleNavClick = (e) => {
    console.log("📍 Nav link clicked on mobile:", isMobile);
    if (isMobile && onClose) {
      console.log("📱 Calling onClose from nav link");
      // Don't prevent default - let the link navigation happen
      onClose();
    }
  };

  return (
    <div className={`h-screen bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
      isMobile ? 'w-64' : isCollapsed ? 'w-20' : 'w-64'
    } ${isMobile ? 'fixed left-0 top-0 z-50' : 'relative'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                H
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HealthBridge
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userInfo?.role || 'Guest'}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto shadow-md">
              H
            </div>
          )}

          {/* Toggle Button - Shows appropriate icon based on state */}
          <button
            onClick={handleToggleClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            aria-label={isMobile ? "Close sidebar" : isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {getToggleIcon()}
          </button>
        </div>
      </div>

      {/* Navigation - Scrollable if needed */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              onClick={handleNavClick} // ADDED onClick handler
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="whitespace-nowrap">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - Only show when sidebar is expanded or on mobile */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              Need Help?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Contact our support team
            </p>
            <button 
              onClick={() => isMobile && onClose && onClose()} // Also close sidebar on mobile
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-300 shadow-sm hover:shadow-md"
            >
              Get Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
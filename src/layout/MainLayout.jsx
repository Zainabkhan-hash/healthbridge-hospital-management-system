// layout/MainLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet, useLocation } from "react-router-dom";

export default function MainLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On mobile, sidebar starts closed. On desktop, it starts open.
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    console.log("🔄 Toggling sidebar. Current state:", sidebarOpen, "Mobile:", isMobile);
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log("📱 Closing mobile sidebar");
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 fixed left-0 top-0 h-screen z-30`}>
        <Sidebar 
          isCollapsed={!sidebarOpen}
          onToggle={toggleSidebar}
        />
      </div>
      
      {/* Mobile Sidebar - Shows when sidebarOpen is true on mobile */}
      {isMobile && sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-50">
            <Sidebar 
              isMobile={true}
              onClose={closeSidebar}
            />
          </div>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidebar}
          />
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        !isMobile ? (sidebarOpen ? 'lg:ml-64' : 'lg:ml-20') : 'lg:ml-0'
      }`}>
        <Topbar onMenuToggle={toggleSidebar} />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
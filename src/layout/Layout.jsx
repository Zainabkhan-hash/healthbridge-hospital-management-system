// layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  console.log("🏗️ Layout rendered - Sidebar open:", sidebarOpen);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    console.log("📱 Mobile menu toggle clicked - Current state:", sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarToggle = () => {
    console.log("💻 Desktop sidebar toggle clicked");
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSidebarClose = () => {
    console.log("❌ Sidebar close requested from Sidebar component");
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            console.log("🌑 Overlay clicked");
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden transform transition-transform duration-300 fixed z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          isMobile={true}
          onClose={handleSidebarClose}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 `}>
        <Topbar onMenuToggle={handleMenuToggle} />
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
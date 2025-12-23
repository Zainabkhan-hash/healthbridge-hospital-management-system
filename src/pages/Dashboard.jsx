import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  Activity,
  ArrowUpRight,
  Pill,
  AlertCircle,
  RefreshCw,
  X,
  Search,
  Filter,
  Download,
  Eye,
  Heart,
  FileText
} from "lucide-react";
import { dashboardAPI, patientsAPI, appointmentsAPI, prescriptionsAPI, labReportsAPI } from "../services/api";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const [error, setError] = useState("");

  // Fetch dashboard data from backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Fetching dashboard data from backend...");
      
      const role = userInfo?.role || 'admin';
      
      if (role === 'patient') {
        // Fetch patient-specific data
        const [dashboardRes, profileRes, appointmentsRes, prescriptionsRes] = await Promise.all([
          dashboardAPI.getDashboardData().catch(() => ({ success: false })),
          patientsAPI.getMyProfile().catch(() => ({ success: false })),
          appointmentsAPI.getMyAppointments({ status: 'upcoming', limit: 3 }).catch(() => ({ success: false, data: [] })),
          prescriptionsAPI.getMyPrescriptions({ limit: 3 }).catch(() => ({ success: false, data: [] }))
        ]);

        const dashboard = dashboardRes.success ? dashboardRes : null;
        const profile = profileRes.success ? profileRes : null;
        const appointments = appointmentsRes.success ? appointmentsRes : null;
        const prescriptions = prescriptionsRes.success ? prescriptionsRes : null;

        // Combine data
        const patientData = {
          success: true,
          role: 'patient',
          patient: profile?.data || profile || {
            _id: userInfo?.id,
            mrn: userInfo?.mrn || 'MRN001',
            name: userInfo?.name || 'Patient',
            age: userInfo?.age || 0,
            gender: userInfo?.gender || 'Unknown',
            bloodGroup: userInfo?.bloodGroup || 'Unknown',
            allergies: userInfo?.allergies || [],
            status: 'Active',
            email: userInfo?.email,
            phone: userInfo?.phone
          },
          stats: {
            totalAppointments: dashboard?.data?.stats?.totalAppointments || appointments?.data?.total || 0,
            upcomingAppointments: appointments?.data?.appointments?.length || 0,
            completedAppointments: dashboard?.data?.stats?.completedAppointments || 0,
            totalSpent: dashboard?.data?.stats?.totalSpent || 0
          },
          upcomingAppointments: appointments?.data?.appointments?.slice(0, 3) || [],
          recentPrescriptions: prescriptions?.data?.prescriptions?.slice(0, 3) || [],
          medicalAlerts: profile?.data?.allergies?.map(allergy => ({
            type: "Allergy",
            message: `Allergic to: ${allergy}`,
            priority: "high"
          })) || [],
          source: "API"
        };

        setDashboardData(patientData);
        
      } else if (role === 'doctor') {
        // Fetch doctor-specific data
        const dashboardRes = await dashboardAPI.getDashboardData();
        
        const doctorData = {
          success: true,
          role: 'doctor',
          doctor: dashboardRes?.data?.doctor || {
            _id: userInfo?.doctorId || userInfo?.id,
            name: userInfo?.name || 'Dr. Demo Doctor',
            specialization: userInfo?.specialization || 'General Practitioner',
            qualification: userInfo?.qualification || 'MBBS',
            consultationFee: userInfo?.consultationFee || 1500,
            status: 'Available'
          },
          stats: {
            totalAppointments: dashboardRes?.data?.stats?.totalAppointments || 0,
            todaysAppointments: dashboardRes?.data?.stats?.todaysAppointments || 0,
            upcomingAppointments: dashboardRes?.data?.stats?.upcomingAppointments || 0,
            monthlyEarnings: dashboardRes?.data?.stats?.monthlyEarnings || 0,
            totalEarnings: dashboardRes?.data?.stats?.totalEarnings || 0
          },
          todaysAppointments: dashboardRes?.data?.todaysAppointments || [],
          upcomingAppointments: dashboardRes?.data?.upcomingAppointments || [],
          source: "API"
        };

        setDashboardData(doctorData);
        
      } else {
        // Admin dashboard
        const dashboardRes = await dashboardAPI.getDashboardData();
        
        const adminData = {
          success: true,
          role: 'admin',
          stats: {
            totalPatients: dashboardRes?.data?.stats?.totalPatients || 0,
            totalDoctors: dashboardRes?.data?.stats?.totalDoctors || 0,
            todayAppointments: dashboardRes?.data?.stats?.todayAppointments || 0,
            monthlyRevenue: dashboardRes?.data?.stats?.monthlyRevenue || 0,
            totalRevenue: dashboardRes?.data?.stats?.totalRevenue || 0
          },
          recentAppointments: dashboardRes?.data?.recentAppointments || [],
          upcomingAppointments: dashboardRes?.data?.upcomingAppointments || [],
          systemAlerts: dashboardRes?.data?.systemAlerts || [],
          source: "API"
        };

        setDashboardData(adminData);
      }
      
      setLastUpdated(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('❌ API Error:', error);
      setError(error.message || 'Failed to load dashboard data');
      // Use fallback data based on user role
      const fallbackData = getFallbackData();
      setDashboardData(fallbackData);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackData = () => {
    const role = userInfo?.role || 'admin';
    
    if (role === 'patient') {
      return {
        success: false,
        role: 'patient',
        patient: {
          _id: userInfo?.id || '1',
          mrn: userInfo?.mrn || 'MRN001',
          name: userInfo?.name || 'Demo Patient',
          age: userInfo?.age || 35,
          gender: userInfo?.gender || 'Male',
          bloodGroup: userInfo?.bloodGroup || 'O+',
          allergies: userInfo?.allergies || ['Penicillin'],
          status: 'Active',
          email: userInfo?.email || 'patient@demo.com',
          phone: userInfo?.phone || '+92 300 1234567'
        },
        stats: {
          totalAppointments: 12,
          upcomingAppointments: 2,
          completedAppointments: 10,
          totalSpent: 4500
        },
        upcomingAppointments: [
          {
            id: '1',
            doctor: 'Dr. Ahmed Khan',
            specialization: 'Cardiologist',
            date: new Date().toISOString().split('T')[0],
            time: '10:00 AM',
            type: 'Consultation',
            status: 'confirmed',
            fee: 1500
          }
        ],
        recentPrescriptions: [
          {
            id: '2',
            medication: 'Antihistamine',
            dosage: '1 tablet daily',
            doctor: 'Dr. System Administrator',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            status: 'active'
          }
        ],
        medicalAlerts: [
          { type: "Allergy", message: "Allergic to: Penicillin", priority: "high" }
        ],
        source: "STATIC_FALLBACK"
      };
    } else if (role === 'doctor') {
      return {
        success: false,
        role: 'doctor',
        doctor: {
          _id: userInfo?.id || '1',
          name: userInfo?.name || 'Dr. Demo Doctor',
          specialization: userInfo?.specialization || 'Cardiologist',
          qualification: userInfo?.qualification || 'MBBS, FCPS',
          consultationFee: userInfo?.consultationFee || 1500,
          status: 'Available'
        },
        stats: {
          totalAppointments: 45,
          todaysAppointments: 3,
          upcomingAppointments: 12,
          monthlyEarnings: 45000,
          totalEarnings: 125000
        },
        todaysAppointments: [
          {
            id: '1',
            patient: 'Ali Khan',
            mrn: 'MRN001',
            time: '10:00 AM',
            type: 'Consultation',
            status: 'confirmed',
            reason: 'Regular checkup'
          }
        ],
        upcomingAppointments: [
          {
            id: '2',
            patient: 'Sara Ahmed',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '11:30 AM',
            type: 'Follow-up',
            status: 'confirmed'
          }
        ],
        source: "STATIC_FALLBACK"
      };
    } else {
      // Admin fallback
      return {
        success: false,
        role: 'admin',
        stats: {
          totalPatients: 1247,
          totalDoctors: 45,
          todayAppointments: 28,
          monthlyRevenue: 450000,
          totalRevenue: 1250000
        },
        recentAppointments: [
          { 
            id: 1, 
            patient: 'Ali Khan', 
            doctor: 'Dr. Ahmed Khan', 
            date: new Date().toISOString().split('T')[0], 
            time: '10:00 AM', 
            status: 'confirmed', 
            fee: 1500 
          }
        ],
        upcomingAppointments: [
          { 
            id: 2, 
            patient: 'Sara Ahmed', 
            doctor: 'Dr. Fatima Malik', 
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
            time: '11:30 AM', 
            type: 'Follow-up' 
          }
        ],
        systemAlerts: [
          { type: "System", message: "All systems operational", priority: "low" }
        ],
        source: "STATIC_FALLBACK"
      };
    }
  };

  // Get stats based on user role and data
  const getStats = () => {
    if (!dashboardData) return getDefaultStats();
    
    const role = dashboardData.role || userInfo?.role || 'admin';
    
    if (role === 'patient') {
      return [
        {
          title: "Total Appointments",
          value: dashboardData.stats?.totalAppointments?.toString() || "0",
          change: "+12.5%",
          icon: Calendar,
          color: "blue",
          description: "All appointments",
          type: "appointments"
        },
        {
          title: "Upcoming",
          value: dashboardData.stats?.upcomingAppointments?.toString() || "0",
          change: "+8.1%",
          icon: Clock,
          color: "amber",
          description: "Scheduled visits",
          type: "upcoming"
        },
        {
          title: "Completed",
          value: dashboardData.stats?.completedAppointments?.toString() || "0",
          change: "+15.3%",
          icon: FileText,
          color: "green",
          description: "Past appointments",
          type: "completed"
        },
        {
          title: "Total Spent",
          value: `PKR ${(dashboardData.stats?.totalSpent || 0).toLocaleString()}`,
          change: "+5.2%",
          icon: DollarSign,
          color: "purple",
          description: "Medical expenses",
          type: "revenue"
        }
      ];
    } else if (role === 'doctor') {
      return [
        {
          title: "Total Appointments",
          value: dashboardData.stats?.totalAppointments?.toString() || "0",
          change: "+12.5%",
          icon: Calendar,
          color: "blue",
          description: "All appointments",
          type: "appointments"
        },
        {
          title: "Today's Schedule",
          value: dashboardData.stats?.todaysAppointments?.toString() || "0",
          change: "+8.1%",
          icon: Clock,
          color: "amber",
          description: "Today's appointments",
          type: "today"
        },
        {
          title: "Monthly Earnings",
          value: `PKR ${(dashboardData.stats?.monthlyEarnings || 0).toLocaleString()}`,
          change: "+15.3%",
          icon: DollarSign,
          color: "green",
          description: "This month",
          type: "revenue"
        },
        {
          title: "Total Earnings",
          value: `PKR ${(dashboardData.stats?.totalEarnings || 0).toLocaleString()}`,
          change: "+22.7%",
          icon: TrendingUp,
          color: "purple",
          description: "All time",
          type: "earnings"
        }
      ];
    } else {
      // Admin stats
      return [
        {
          title: "Total Patients",
          value: dashboardData.stats?.totalPatients?.toLocaleString() || "0",
          change: "+12.5%",
          icon: Users,
          color: "blue",
          description: "Registered patients",
          type: "patients"
        },
        {
          title: "Medical Staff",
          value: dashboardData.stats?.totalDoctors?.toString() || "0",
          change: "+3.2%",
          icon: Stethoscope,
          color: "green",
          description: "Doctors & nurses",
          type: "staff"
        },
        {
          title: "Today Appointments",
          value: dashboardData.stats?.todayAppointments?.toString() || "0",
          change: "+8.1%",
          icon: Calendar,
          color: "amber",
          description: "Scheduled visits",
          type: "appointments"
        },
        {
          title: "Monthly Revenue",
          value: `PKR ${(dashboardData.stats?.monthlyRevenue || 0).toLocaleString()}`,
          change: "+15.3%",
          icon: DollarSign,
          color: "purple",
          description: "Total earnings",
          type: "revenue"
        }
      ];
    }
  };

  const getDefaultStats = () => {
    const role = userInfo?.role || 'admin';
    
    if (role === 'patient') {
      return [
        {
          title: "Total Appointments",
          value: "12",
          change: "+12.5%",
          icon: Calendar,
          color: "blue",
          description: "All appointments",
          type: "appointments"
        },
        {
          title: "Upcoming",
          value: "2",
          change: "+8.1%",
          icon: Clock,
          color: "amber",
          description: "Scheduled visits",
          type: "upcoming"
        },
        {
          title: "Completed",
          value: "10",
          change: "+15.3%",
          icon: FileText,
          color: "green",
          description: "Past appointments",
          type: "completed"
        },
        {
          title: "Total Spent",
          value: "PKR 4,500",
          change: "+5.2%",
          icon: DollarSign,
          color: "purple",
          description: "Medical expenses",
          type: "revenue"
        }
      ];
    } else if (role === 'doctor') {
      return [
        {
          title: "Total Appointments",
          value: "45",
          change: "+12.5%",
          icon: Calendar,
          color: "blue",
          description: "All appointments",
          type: "appointments"
        },
        {
          title: "Today's Schedule",
          value: "3",
          change: "+8.1%",
          icon: Clock,
          color: "amber",
          description: "Today's appointments",
          type: "today"
        },
        {
          title: "Monthly Earnings",
          value: "PKR 45,000",
          change: "+15.3%",
          icon: DollarSign,
          color: "green",
          description: "This month",
          type: "revenue"
        },
        {
          title: "Total Earnings",
          value: "PKR 125,000",
          change: "+22.7%",
          icon: TrendingUp,
          color: "purple",
          description: "All time",
          type: "earnings"
        }
      ];
    } else {
      return [
        {
          title: "Total Patients",
          value: "1,247",
          change: "+12.5%",
          icon: Users,
          color: "blue",
          description: "Active patients",
          type: "patients"
        },
        {
          title: "Medical Staff",
          value: "45",
          change: "+3.2%",
          icon: Stethoscope,
          color: "green",
          description: "Doctors & nurses",
          type: "staff"
        },
        {
          title: "Today Appointments",
          value: "28",
          change: "+8.1%",
          icon: Calendar,
          color: "amber",
          description: "Scheduled visits",
          type: "appointments"
        },
        {
          title: "Monthly Revenue",
          value: "PKR 450K",
          change: "+15.3%",
          icon: DollarSign,
          color: "purple",
          description: "Total earnings",
          type: "revenue"
        }
      ];
    }
  };

  const stats = getStats();

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", light: "bg-blue-100 dark:bg-blue-900/30" },
      green: { bg: "bg-green-500", text: "text-green-600 dark:text-green-400", light: "bg-green-100 dark:bg-green-900/30" },
      amber: { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", light: "bg-amber-100 dark:bg-amber-900/30" },
      purple: { bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", light: "bg-purple-100 dark:bg-purple-900/30" }
    };
    return colors[color] || colors.blue;
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const role = dashboardData?.role || userInfo?.role || 'admin';

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {role === 'patient' ? 'Patient Dashboard' : 
               role === 'doctor' ? 'Doctor Dashboard' : 'Medical Dashboard'}
              {dashboardData && (
                <span className="ml-2 text-sm font-normal">
                  {dashboardData.success ? (
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                      ✅ Live Data
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                      ⚠️ Demo Data
                    </span>
                  )}
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {lastUpdated ? `Last updated: ${lastUpdated}` : "Real-time overview"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const color = getColorClasses(stat.color);
            return (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${color.light} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${color.text}`} />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                    stat.change.startsWith('+') 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              </div>
            );
          })}
        </div>

        {/* Role-specific content */}
        {role === 'patient' && dashboardData?.patient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Profile Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Profile</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">MRN:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dashboardData.patient.mrn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dashboardData.patient.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dashboardData.patient.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Blood Group:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dashboardData.patient.bloodGroup}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Appointments</h3>
                </div>
                <div className="p-6">
                  {dashboardData.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardData.upcomingAppointments.map((apt, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                              {apt.doctor?.name?.split(' ').map(n => n[0]).join('') || 'DR'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{apt.doctor?.name || 'Doctor'}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{apt.doctor?.specialization || 'General'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{apt.type || 'Consultation'} • {apt.appointmentDate || apt.date} at {apt.appointmentTime || apt.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              apt.status === 'confirmed' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {apt.status || 'scheduled'}
                            </span>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">PKR {apt.consultationFee || apt.fee || '0'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming appointments</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Alerts for Patient */}
        {role === 'patient' && dashboardData?.medicalAlerts && dashboardData.medicalAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Medical Alerts
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {dashboardData.medicalAlerts.map((alert, index) => (
                  <div key={index} className="p-3 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
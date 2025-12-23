import React, { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, TrendingUp, Activity, Calendar as CalendarIcon, RefreshCw, Loader2 } from 'lucide-react';
import { dashboardAPI, patientsAPI, doctorsAPI, appointmentsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import Summary from '../../components/Summary';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPatients: 0,
      totalDoctors: 0,
      totalAppointments: 0,
      todaysAppointments: 0,
      monthlyRevenue: 0,
      totalRevenue: 0
    },
    recentAppointments: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [dashboardRes, patientsRes, doctorsRes, appointmentsRes] = await Promise.allSettled([
        dashboardAPI.getDashboardData(),
        patientsAPI.getPatients({ limit: 100 }),
        doctorsAPI.getDoctors({ limit: 100 }),
        appointmentsAPI.getAppointments({ limit: 50 })
      ]);

      console.log('📦 API Responses:', {
        dashboard: dashboardRes,
        patients: patientsRes,
        doctors: doctorsRes,
        appointments: appointmentsRes
      });

      // Process dashboard data
      const dashboard = dashboardRes.status === 'fulfilled' ? dashboardRes.value : null;
      
      // Get counts from APIs
      const patientsData = patientsRes.status === 'fulfilled' ? patientsRes.value : null;
      const patientsCount = patientsData?.pagination?.totalPatients || patientsData?.data?.length || 0;
      
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value : null;
      const doctorsCount = doctorsData?.pagination?.totalDoctors || doctorsData?.data?.length || 0;
      
      const appointmentsData = appointmentsRes.status === 'fulfilled' && appointmentsRes.value?.data 
        ? appointmentsRes.value.data 
        : [];

      console.log('✅ Processed data:', {
        patientsCount,
        doctorsCount,
        appointmentsCount: appointmentsData.length,
        appointments: appointmentsData
      });

      // Calculate today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysAppointments = appointmentsData.filter(apt => {
        if (!apt.appointmentDate) return false;
        const aptDate = new Date(apt.appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      }).length;

      // Sort appointments by date
      const sortedAppointments = [...appointmentsData].sort((a, b) => 
        new Date(b.appointmentDate) - new Date(a.appointmentDate)
      );

      // Get recent appointments (completed or past)
      const recentAppointments = sortedAppointments
        .filter(apt => apt.status === 'completed' || new Date(apt.appointmentDate) < new Date())
        .slice(0, 3)
        .map(apt => ({
          id: apt._id,
          patient: apt.patientID?.name || 'Unknown Patient',
          doctor: apt.doctorID?.name || 'Unknown Doctor',
          date: apt.appointmentDate,
          time: apt.appointmentTime,
          status: apt.status,
          fee: apt.consultationFee || apt.doctorID?.consultationFee || 0
        }));

      // Get upcoming appointments (future dates)
      const upcomingAppointments = sortedAppointments
        .filter(apt => new Date(apt.appointmentDate) >= new Date())
        .slice(0, 5)
        .map(apt => ({
          id: apt._id,
          patient: apt.patientID?.name || 'Unknown Patient',
          doctor: apt.doctorID?.name || 'Unknown Doctor',
          date: apt.appointmentDate,
          time: apt.appointmentTime,
          type: apt.type || 'Consultation'
        }));

      // Calculate revenue
      const monthlyRevenue = appointmentsData
        .filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          const now = new Date();
          return aptDate.getMonth() === now.getMonth() && 
                 aptDate.getFullYear() === now.getFullYear() &&
                 apt.paymentStatus === 'paid';
        })
        .reduce((sum, apt) => sum + (apt.consultationFee || apt.doctorID?.consultationFee || 0), 0);

      const totalRevenue = appointmentsData
        .filter(apt => apt.paymentStatus === 'paid')
        .reduce((sum, apt) => sum + (apt.consultationFee || apt.doctorID?.consultationFee || 0), 0);

      // Combine all data
      const combinedData = {
        stats: {
          totalPatients: dashboard?.data?.stats?.totalPatients || patientsCount,
          totalDoctors: dashboard?.data?.stats?.totalDoctors || doctorsCount,
          totalAppointments: dashboard?.data?.stats?.totalAppointments || appointmentsData.length,
          todaysAppointments: dashboard?.data?.stats?.todaysAppointments || todaysAppointments,
          monthlyRevenue: dashboard?.data?.stats?.monthlyRevenue || monthlyRevenue,
          totalRevenue: dashboard?.data?.stats?.totalRevenue || totalRevenue
        },
        recentAppointments: dashboard?.data?.recentAppointments || recentAppointments,
        upcomingAppointments: dashboard?.data?.upcomingAppointments || upcomingAppointments,
        source: dashboard?.success ? "API" : "COMBINED"
      };

      console.log('🎯 Final dashboard data:', combinedData);
      setDashboardData(combinedData);
      
    } catch (error) {
      console.error('💥 Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome to HealthBridge Administration</p>
        </div>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white dark:text-zinc-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Patients"
          value={dashboardData.stats.totalPatients}
          change="+12%"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Stethoscope}
          title="Active Doctors"
          value={dashboardData.stats.totalDoctors}
          change="+5%"
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={dashboardData.stats.todaysAppointments}
          change="+8%"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
        />
        <StatCard
          icon={TrendingUp}
          title="Monthly Revenue"
          value={`PKR ${dashboardData.stats.monthlyRevenue.toLocaleString()}`}
          change="+15%"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Summary
            title="Total Appointments"
            count={dashboardData.stats.totalAppointments}
            color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <Summary
            title="Total Revenue"
            count={`PKR ${dashboardData.stats.totalRevenue.toLocaleString()}`}
            color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
           
          />
          <Summary
            title="Active Patients"
            count={dashboardData.stats.totalPatients}
            color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <Summary
            title="Medical Staff"
            count={dashboardData.stats.totalDoctors}
            color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </div>

        {/* Recent Activity */}
        <ChartCard title="Recent Appointments">
          <div className="space-y-4">
            {dashboardData.recentAppointments.length > 0 ? (
              dashboardData.recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {appointment.patient}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appointment.doctor}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatTime(appointment.time)}
                    </p>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                       {formatDate(appointment.date)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {appointment.status || 'scheduled'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent appointments</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Upcoming Appointments */}
      <ChartCard title="Upcoming Appointments" action="View All">
        <div className="space-y-3">
          {dashboardData.upcomingAppointments.length > 0 ? (
            dashboardData.upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {appointment.patient}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {appointment.doctor} • {appointment.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(appointment.date)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(appointment.time)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
};

export default AdminDashboard;
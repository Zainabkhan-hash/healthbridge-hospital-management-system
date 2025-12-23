// src/pages/patient/PatientDashboard.jsx
import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  FileText, 
  Pill, 
  Activity, 
  Clock, 
  AlertCircle,
  TrendingUp,
  User,
  Loader2,
  RefreshCw,
  CalendarCheck
} from "lucide-react";
import { patientsAPI, appointmentsAPI, prescriptionsAPI, labReportsAPI } from "../../services/api";

const PatientDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    patient: null,
    todayAppointments: [],
    upcomingAppointments: [],
    completedAppointments: [],
    recentPrescriptions: [],
    pendingLabReports: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    setUserInfo(storedUserInfo);
    
    if (storedUserInfo) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [profileRes, appointmentsRes, prescriptionsRes, labReportsRes] = await Promise.allSettled([
        patientsAPI.getMyProfile(),
        appointmentsAPI.getMyAppointments(),
        prescriptionsAPI.getMyPrescriptions({ limit: 5 }),
        labReportsAPI.getMyLabReports({ status: 'pending' })
      ]);

      // Patient Profile
      const patientProfile = profileRes.status === 'fulfilled'
        ? (profileRes.value?.data || profileRes.value || {})
        : { name: userInfo?.name || 'Patient', mrn: userInfo?.mrn || 'MRN001', bloodGroup: 'Unknown', age: 'N/A' };

      // All Appointments
      const allAppointments = appointmentsRes.status === 'fulfilled'
        ? (appointmentsRes.value?.data || appointmentsRes.value || [])
        : [];

      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // Get tomorrow's date (start of day)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTime = tomorrow.getTime();

      // Filter TODAY's appointments (not completed)
      const todayAppointments = allAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          const aptTime = aptDate.getTime();
          
          return aptTime === todayTime && apt.status !== 'completed';
        })
        .sort((a, b) => {
          // Sort by time if available
          const timeA = a.appointmentTime || '';
          const timeB = b.appointmentTime || '';
          return timeA.localeCompare(timeB);
        });

      // Filter UPCOMING appointments (tomorrow and beyond, not completed)
      const upcomingAppointments = allAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          const aptTime = aptDate.getTime();
          
          return aptTime >= tomorrowTime && apt.status !== 'completed';
        })
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        .slice(0, 5);

      // Filter ONLY completed appointments
      const completedAppointments = allAppointments.filter(apt => 
        apt.status === 'completed'
      );

      const recentPrescriptions = prescriptionsRes.status === 'fulfilled'
        ? (prescriptionsRes.value?.data || prescriptionsRes.value || []).slice(0, 5)
        : [];

      const pendingLabReports = labReportsRes.status === 'fulfilled'
        ? (labReportsRes.value?.data || labReportsRes.value || [])
        : [];

      const alerts = generateAlerts(todayAppointments, upcomingAppointments, pendingLabReports, patientProfile);

      setDashboardData({
        patient: patientProfile,
        todayAppointments,
        upcomingAppointments,
        completedAppointments,
        recentPrescriptions,
        pendingLabReports,
        alerts
      });

    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (todayApts, upcomingApts, labReports, patient) => {
    const alerts = [];
    if (patient?.allergies?.length > 0) {
      alerts.push(`Allergies: ${patient.allergies.join(', ')}`);
    }
    
    // Alert for today's appointments
    if (todayApts.length > 0) {
      alerts.push(`You have ${todayApts.length} appointment${todayApts.length > 1 ? 's' : ''} today`);
    }
    
    // Alert for upcoming appointments within 48 hours
    upcomingApts.slice(0, 2).forEach(apt => {
      const hours = Math.round((new Date(apt.appointmentDate) - new Date()) / (1000 * 60 * 60));
      if (hours > 0 && hours <= 48) {
        alerts.push(`Appointment with ${apt.doctorID?.name || 'Doctor'} in ${hours} hour${hours > 1 ? 's' : ''}`);
      }
    });
    
    if (labReports.length > 0) alerts.push(`You have ${labReports.length} pending lab report(s)`);
    return alerts.length > 0 ? alerts : ['All good! No urgent alerts today.'];
  };

  // Calculate total spent from ONLY completed appointments
  const calculateTotalSpent = () => {
    return dashboardData.completedAppointments.reduce((total, apt) => {
      return total + (apt.consultationFee || 0);
    }, 0);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const AppointmentCard = ({ apt }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
          {apt.doctorID?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'DR'}
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">
            {apt.doctorID?.name || 'Dr. Unknown'}
          </p>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {apt.doctorID?.specialization || 'General Physician'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {apt.appointmentTime}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-green-600">PKR {apt.consultationFee?.toLocaleString()}</p>
        <span className={`mt-1 inline-block px-3 py-1 text-xs font-medium rounded-full ${
          apt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        }`}>
          {apt.status}
        </span>
      </div>
    </div>
  );

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Please log in to continue</p>
          <a href="/login" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mr-4" />
        <span className="text-lg text-gray-600 dark:text-gray-400">Loading your health dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {dashboardData.patient?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 lg:mt-0 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:text-zinc-50 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Patient Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {dashboardData.patient?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'PT'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.patient?.name}</h2>
            <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2"><User className="w-4 h-4" /> MRN: {dashboardData.patient?.mrn || 'N/A'}</div>
              <div>Age: {dashboardData.patient?.age || 'N/A'}</div>
              <div>Blood Group: {dashboardData.patient?.bloodGroup || 'Unknown'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-amber-800 dark:text-amber-300">Health Alerts</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-amber-700 dark:text-amber-400">
            {dashboardData.alerts.map((alert, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard 
          icon={CalendarCheck} 
          title="Today" 
          value={dashboardData.todayAppointments.length} 
          subtitle="Appointments" 
          color="purple" 
        />
        <StatCard 
          icon={Calendar} 
          title="Upcoming" 
          value={dashboardData.upcomingAppointments.length} 
          subtitle="Appointments" 
          color="blue" 
        />
        <StatCard 
          icon={Pill} 
          title="Prescriptions" 
          value={dashboardData.recentPrescriptions.length} 
          subtitle="Active" 
          color="green" 
        />
        <StatCard 
          icon={Activity} 
          title="Lab Reports" 
          value={dashboardData.pendingLabReports.length} 
          subtitle="Pending" 
          color="orange" 
        />
        <StatCard 
          icon={TrendingUp} 
          title="Total Spent" 
          value={`PKR ${calculateTotalSpent().toLocaleString()}`}
          subtitle={`${dashboardData.completedAppointments.length} completed`}
          color="red" 
        />
      </div>

      {/* Today's Appointments - Only show if there are appointments today */}
      {dashboardData.todayAppointments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Today's Appointments
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData.todayAppointments.map((apt) => (
              <AppointmentCard key={apt._id} apt={apt} />
            ))}
          </div>
        </div>
      )}

      {/* Appointments & Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Upcoming Appointments
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {dashboardData.upcomingAppointments.length > 0 ? (
              dashboardData.upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt._id} apt={apt} />
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              Recent Prescriptions
            </h3>
          </div>
          <div className="p-6">
            {dashboardData.recentPrescriptions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentPrescriptions.map(p => (
                  <div key={p._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900 dark:text-white">{p.medication}</p>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        {p.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{p.dosage}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">by Dr. {p.doctor?.name || 'Unknown'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No active prescriptions</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/patient/appointments" className="p-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition group">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Book Appointment</span>
          </a>
          <a href="/patient/records" className="p-5 bg-green-50 dark:bg-green-900/30 rounded-xl text-center hover:bg-green-100 dark:hover:bg-green-900/50 transition group">
            <FileText className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-400 group-hover:scale-110 transition" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Medical Records</span>
          </a>
          <a href="/patient/lab-reports" className="p-5 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-center hover:bg-orange-100 dark:hover:bg-orange-900/50 transition group">
            <Activity className="w-10 h-10 mx-auto mb-3 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Lab Results</span>
          </a>
          <a href="/patient/profile" className="p-5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition group">
            <User className="w-10 h-10 mx-auto mb-3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">My Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
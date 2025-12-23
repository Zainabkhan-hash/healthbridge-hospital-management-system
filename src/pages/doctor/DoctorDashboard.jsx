import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Stethoscope,
  Activity,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { dashboardAPI, appointmentsAPI, patientsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    doctor: null,
    stats: {
      totalAppointments: 0,
      todaysAppointments: 0,
      upcomingAppointments: 0,
      monthlyEarnings: 0,
      totalEarnings: 0
    },
    todaysAppointments: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateEarnings = (appointments) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate monthly earnings (completed appointments in current month)
    const monthlyEarnings = appointments
      .filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return apt.status === 'completed' && 
               apt.paymentStatus === 'paid' &&
               aptDate.getMonth() === currentMonth &&
               aptDate.getFullYear() === currentYear;
      })
      .reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);

    // Calculate total earnings (all completed and paid appointments)
    const totalEarnings = appointments
      .filter(apt => apt.status === 'completed' && apt.paymentStatus === 'paid')
      .reduce((sum, apt) => sum + (apt.consultationFee || 0), 0);

    return { monthlyEarnings, totalEarnings };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel
      const [dashboardRes, appointmentsRes, patientsRes] = await Promise.allSettled([
        dashboardAPI.getDashboardData(),           // Your main dashboard API
        appointmentsAPI.getDoctorAppointments(), // Fallback + real appointments
        patientsAPI.getPatients({ limit: 10 })
      ]);

      // Primary source: doctorsAPI.dashboardData()
      let finalData = {
        doctor: null,
        stats: { totalAppointments: 0, todaysAppointments: 0, upcomingAppointments: 0, monthlyEarnings: 0, totalEarnings: 0 },
        todaysAppointments: [],
        upcomingAppointments: [],
        patients: []
      };

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value?.success) {
        // Use full dashboard API if available
        finalData = {
          doctor: dashboardRes.value.data.doctor || getDoctorProfile(),
          stats: dashboardRes.value.data.stats || finalData.stats,
          todaysAppointments: dashboardRes.value.data.todaysAppointments || [],
          upcomingAppointments: dashboardRes.value.data.upcomingAppointments || [],
          patients: dashboardRes.value.data.patients || []
        };
      } else {
        // Fallback: Use real appointments from getDoctorAppointments()
        const appointments = appointmentsRes.status === 'fulfilled'
          ? (appointmentsRes.value.data || appointmentsRes.value || [])
          : [];

        const todayStr = new Date().toISOString().split('T')[0]; // "2025-12-02"

        const todaysRaw = appointments.filter(apt =>
          new Date(apt.appointmentDate).toISOString().split('T')[0] === todayStr
        );

        const upcomingRaw = appointments.filter(apt =>
          new Date(apt.appointmentDate).toISOString().split('T')[0] > todayStr
        );

        // Calculate earnings based on completed appointments
        const { monthlyEarnings, totalEarnings } = calculateEarnings(appointments);

        finalData = {
          doctor: getDoctorProfile(),
          stats: {
            totalAppointments: appointments.length,
            todaysAppointments: todaysRaw.length,
            upcomingAppointments: upcomingRaw.length,
            monthlyEarnings: monthlyEarnings,
            totalEarnings: totalEarnings
          },
          todaysAppointments: todaysRaw.slice(0, 5).map(mapAppointment),
          upcomingAppointments: upcomingRaw.slice(0, 5).map(mapAppointment),
          patients: patientsRes.status === 'fulfilled'
            ? (patientsRes.value.data || patientsRes.value || []).slice(0, 5)
            : []
        };
      }

      setDashboardData(finalData);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard');
      setDashboardData(getFallbackData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDoctorProfile = () => ({
    _id: userInfo?.doctorId || userInfo?.id,
    name: userInfo?.name || 'Dr. Demo Doctor',
    specialization: userInfo?.specialization || 'General Practitioner',
    qualification: userInfo?.qualification || 'MBBS',
    consultationFee: userInfo?.consultationFee || 3000,
    status: 'Available'
  });

  const mapAppointment = (apt) => ({
    _id: apt._id,
    patient: {
      name: apt.patientID?.name || 'Unknown Patient',
      mrn: apt.patientID?.mrn || 'N/A'
    },
    time: apt.appointmentTime || 'N/A',
    type: apt.type || 'Consultation',
    status: apt.status || 'scheduled',
    reason: apt.reason || apt.notes || 'Routine Checkup',
    date: apt.appointmentDate,
    appointmentTime: apt.appointmentTime
  });

  const getFallbackData = () => ({
    doctor: getDoctorProfile(),
    stats: {
      totalAppointments: 156,
      todaysAppointments: 8,
      upcomingAppointments: 12,
      monthlyEarnings: 0,
      totalEarnings: 0
    },
    todaysAppointments: [
      { _id: '1', patient: { name: 'Ali Khan', mrn: 'MRN001' }, time: '10:00 AM', type: 'Consultation', status: 'confirmed', reason: 'Heart checkup' },
      { _id: '2', patient: { name: 'Sara Ahmed', mrn: 'MRN002' }, time: '11:30 AM', type: 'Follow-up', status: 'confirmed', reason: 'BP Review' }
    ],
    upcomingAppointments: [
      { _id: '3', patient: { name: 'Ahmed Raza', mrn: 'MRN003' }, date: new Date(Date.now() + 86400000), time: '09:00 AM', status: 'scheduled' }
    ]
  });

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</span>
      </div>
    );
  }


  console.log(dashboardData.doctor?.consultationFee)
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, Dr. {dashboardData.doctor?.name?.split(' ')[1] || 'Doctor'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {dashboardData.doctor?.specialization} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Doctor Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
            {dashboardData.doctor?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'DD'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {dashboardData.doctor?.name || 'Doctor'}
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Stethoscope className="w-4 h-4" />
                <span>{dashboardData.doctor?.specialization}</span>
              </div>
              <div>Qualification: {dashboardData.doctor?.qualification}</div>
              <div>Fee: PKR {dashboardData.doctor?.consultationFee?.toLocaleString()}</div>
              <div>Status: <span className="text-green-600 font-medium">{dashboardData.doctor?.status}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Calendar} 
          title="Total Appointments" 
          value={dashboardData.stats.totalAppointments} 
          change="+8%" 
          iconBg="bg-blue-100 dark:bg-blue-900/30" 
          iconColor="text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          icon={Clock} 
          title="Today's Appointments" 
          value={dashboardData.stats.todaysAppointments} 
          change="+3%" 
          iconBg="bg-green-100 dark:bg-green-900/30" 
          iconColor="text-green-600 dark:text-green-400" 
        />
        <StatCard 
          icon={Users} 
          title="Upcoming" 
          value={dashboardData.stats.upcomingAppointments} 
          change="+5%" 
          iconBg="bg-orange-100 dark:bg-orange-900/30" 
          iconColor="text-orange-600 dark:text-orange-400" 
        />
        <StatCard 
          icon={TrendingUp} 
          title="Monthly Earnings" 
          value={`PKR ${dashboardData.stats.monthlyEarnings.toLocaleString()}`} 
          subtitle={`Total: PKR ${dashboardData.stats.totalEarnings.toLocaleString()}`}
          change="+12%" 
          iconBg="bg-purple-100 dark:bg-purple-900/30" 
          iconColor="text-purple-600 dark:text-purple-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <ChartCard title="Today's Appointments">
          <div className="space-y-4">
            {dashboardData.todaysAppointments.length > 0 ? (
              dashboardData.todaysAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {apt.patient?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'PT'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{apt.patient?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{apt.patient?.mrn} • {apt.type || 'Consultation'}</p>
                      {apt.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{apt.reason}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.time || apt.appointmentTime}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      apt.status === 'confirmed' || apt.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {apt.status || 'scheduled'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">No appointments today</p>
            )}
          </div>
        </ChartCard>

        {/* Upcoming Appointments */}
        <ChartCard title="Upcoming Appointments" action="View All">
          <div className="space-y-4">
            {dashboardData.upcomingAppointments.length > 0 ? (
              dashboardData.upcomingAppointments.map((apt) => (
                <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {apt.patient?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || 'PT'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{apt.patient?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{apt.patient?.mrn}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(apt.date || apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{apt.time || apt.appointmentTime}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">No upcoming appointments</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/doctor/appointments" className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-center group">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View Schedule</span>
          </a>
          <a href="/doctor/patients" className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-center group">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">My Patients</span>
          </a>
          <a href="/doctor/appointments?action=new" className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors text-center group">
            <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Add Slot</span>
          </a>
          <a href="/doctor/profile" className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-center group">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">My Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
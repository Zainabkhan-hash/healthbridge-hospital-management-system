import Patient from "../models/patientModel.js";
import User from "../models/userModel.js";
import Appointment from "../models/appointmentModel.js";
import Doctor from "../models/doctorsModel.js";

export const getDashboardData = async (req, res) => {
  try {
    console.log("Dashboard data requested by:", req.user.email, "Role:", req.user.role);
    
    if (req.user.role === 'patient') {
      return getPatientDashboard(req, res);
    } else if (req.user.role === 'doctor') {
      return getDoctorDashboard(req, res);
    } else {
      return getAdminDashboard(req, res);
    }

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching dashboard data"
    });
  }
};

// Patient Dashboard
const getPatientDashboard = async (req, res) => {
  const patientId = req.user.patientId;
  
  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID not found"
    });
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found"
    });
  }

  // Get patient's appointments
  const upcomingAppointments = await Appointment.find({
    patient: patientId,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('doctor', 'name specialization consultationFee')
  .sort({ appointmentDate: 1 })
  .limit(5);

  const recentAppointments = await Appointment.find({
    patient: patientId,
    appointmentDate: { $lt: new Date() }
  })
  .populate('doctor', 'name specialization consultationFee')
  .sort({ appointmentDate: -1 })
  .limit(5);

  const totalSpent = await Appointment.aggregate([
    { $match: { patient: patientId, status: 'completed', paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$consultationFee' } } }
  ]);

  const patientDashboard = {
    success: true,
    role: 'patient',
    patient: {
      _id: patient._id,
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      status: patient.status,
      email: patient.email,
      phone: patient.phone
    },
    stats: {
      totalAppointments: await Appointment.countDocuments({ patient: patientId }),
      upcomingAppointments: await Appointment.countDocuments({ 
        patient: patientId, 
        appointmentDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      }),
      completedAppointments: await Appointment.countDocuments({ 
        patient: patientId, 
        status: 'completed' 
      }),
      totalSpent: totalSpent[0]?.total || 0
    },
    upcomingAppointments: upcomingAppointments.map(apt => ({
      id: apt._id,
      doctor: apt.doctor?.name || 'Doctor',
      specialization: apt.doctor?.specialization || 'General',
      date: apt.appointmentDate.toISOString().split('T')[0],
      time: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      fee: apt.consultationFee
    })),
    recentAppointments: recentAppointments.map(apt => ({
      id: apt._id,
      doctor: apt.doctor?.name || 'Doctor',
      date: apt.appointmentDate.toISOString().split('T')[0],
      time: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      fee: apt.consultationFee,
      paymentStatus: apt.paymentStatus
    })),
    medicalAlerts: patient.allergies && patient.allergies.length > 0 ? [
      { type: "Allergy", message: `Allergic to: ${patient.allergies.join(', ')}`, priority: "high" }
    ] : [],
    timestamp: new Date().toISOString()
  };

  return res.json(patientDashboard);
};

// Doctor Dashboard
const getDoctorDashboard = async (req, res) => {
  const doctorId = req.user.doctorId;
  
  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: "Doctor ID not found"
    });
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found"
    });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's appointments
  const todaysAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: todayStart, $lt: todayEnd }
  })
  .populate('patient', 'name mrn phone age gender')
  .sort({ appointmentTime: 1 });

  // Upcoming appointments
  const upcomingAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gt: todayEnd },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('patient', 'name mrn phone age gender')
  .sort({ appointmentDate: 1 })
  .limit(10);

  // Financial stats
  const monthlyEarnings = await Appointment.aggregate([
    { 
      $match: { 
        doctor: doctorId, 
        status: 'completed',
        paymentStatus: 'paid',
        appointmentDate: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
      } 
    },
    { $group: { _id: null, total: { $sum: '$consultationFee' } } }
  ]);

  const doctorDashboard = {
    success: true,
    role: 'doctor',
    doctor: {
      _id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      consultationFee: doctor.consultationFee,
      status: doctor.status
    },
    stats: {
      totalAppointments: await Appointment.countDocuments({ doctor: doctorId }),
      todaysAppointments: todaysAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      monthlyEarnings: monthlyEarnings[0]?.total || 0,
      totalEarnings: doctor.totalEarnings || 0
    },
    todaysAppointments: todaysAppointments.map(apt => ({
      id: apt._id,
      patient: apt.patient?.name || 'Patient',
      mrn: apt.patient?.mrn,
      time: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason
    })),
    upcomingAppointments: upcomingAppointments.map(apt => ({
      id: apt._id,
      patient: apt.patient?.name || 'Patient',
      date: apt.appointmentDate.toISOString().split('T')[0],
      time: apt.appointmentTime,
      type: apt.type,
      status: apt.status
    })),
    timestamp: new Date().toISOString()
  };

  return res.json(doctorDashboard);
};

// Admin Dashboard
// Admin Dashboard - FIXED VERSION
const getAdminDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Use Promise.all for performance
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todaysAppointmentsCount,
      revenueResult,
      recentAppointments,
      upcomingAppointments
    ] = await Promise.all([
      Patient.countDocuments().catch(() => 0),
      Doctor.countDocuments().catch(() => 0),
      Appointment.countDocuments().catch(() => 0),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lt: todayEnd }
      }).catch(() => 0),

      // Safe aggregation with fallback
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            paymentStatus: 'paid',
            consultationFee: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$consultationFee' },
            monthlyRevenue: {
              $sum: {
                $cond: [
                  { $gte: ['$appointmentDate', monthStart] },
                  '$consultationFee',
                  0
                ]
              }
            }
          }
        }
      ]).then(result => result[0] || { totalRevenue: 0, monthlyRevenue: 0 })
       .catch(err => {
         console.error("Revenue aggregation failed:", err);
         return { totalRevenue: 0, monthlyRevenue: 0 };
       }),

      // Recent appointments
      Appointment.find()
        .populate('patient', 'name mrn')
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(10)
        .catch(() => []),

      // Upcoming appointments
      Appointment.find({
        appointmentDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      })
        .populate('patient', 'name mrn')
        .populate('doctor', 'name specialization')
        .sort({ appointmentDate: 1 })
        .limit(10)
        .catch(() => [])
    ]);

    const adminDashboard = {
      success: true,
      role: 'admin',
      stats: {
        totalPatients: totalPatients || 0,
        totalDoctors: totalDoctors || 0,
        totalAppointments: totalAppointments || 0,
        todaysAppointments: todaysAppointmentsCount || 0,
        monthlyRevenue: revenueResult.monthlyRevenue || 0,
        totalRevenue: revenueResult.totalRevenue || 0
      },
      recentAppointments: (recentAppointments || []).map(apt => ({
        id: apt._id.toString(),
        patient: apt.patient?.name || 'Unknown Patient',
        doctor: apt.doctor?.name || 'Unknown Doctor',
        date: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : 'N/A',
        time: apt.appointmentTime || 'N/A',
        status: apt.status || 'unknown',
        fee: apt.consultationFee || 0
      })),
      upcomingAppointments: (upcomingAppointments || []).map(apt => ({
        id: apt._id.toString(),
        patient: apt.patient?.name || 'Unknown Patient',
        doctor: apt.doctor?.name || 'Unknown Doctor',
        date: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString().split('T')[0] : 'N/A',
        time: apt.appointmentTime || 'N/A',
        type: apt.type || 'Consultation'
      })),
      timestamp: new Date().toISOString()
    };

    console.log("Admin Dashboard Data Sent:", adminDashboard.stats);
    res.json(adminDashboard);

  } catch (error) {
    console.error("getAdminDashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard data",
      error: error.message
    });
  }
};
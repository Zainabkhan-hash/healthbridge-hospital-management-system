import Patient from "../models/patientModel.js"
import Appointment from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

// Get all patients with search and pagination
export const getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;
    
    // Search filter
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mrn: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { cnic: { $regex: search, $options: "i" } }
        ]
      };
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const patients = await Patient.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      data: patients,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPatients: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching patients" 
    });
  }
};

// Get single patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching patient" 
    });
  }
};

// Create new patient
export const createPatient = async (req, res) => {
  try {
    // Generate MRN automatically
    const lastPatient = await Patient.findOne().sort({ createdAt: -1 });
    let newMRN = "MRN001";
    
    if (lastPatient && lastPatient.mrn) {
      const lastNumber = parseInt(lastPatient.mrn.replace("MRN", ""));
      newMRN = `MRN${(lastNumber + 1).toString().padStart(3, "0")}`;
    }

    const patientData = {
      ...req.body,
      mrn: newMRN
    };

    const patient = await Patient.create(patientData);
    
    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient
    });

  } catch (error) {
    console.error("Create patient error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Patient with same CNIC or MRN already exists" 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error creating patient" 
    });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });

  } catch (error) {
    console.error("Update patient error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Patient with same CNIC already exists" 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error updating patient" 
    });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting patient" 
    });
  }
};

// Bulk delete patients
export const bulkDeletePatients = async (req, res) => {
  try {
    const { patientIds } = req.body;
    
    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No patient IDs provided" 
      });
    }

    const result = await Patient.deleteMany({ _id: { $in: patientIds } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} patients deleted successfully`
    });

  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting patients" 
    });
  }
};

// Get patient's own data
export const getMyProfile = async (req, res) => {
  try {
    // console.log("Patient ID from token:", req.user.id);
   
    const currentUser = await userModel.findById(req.user.id)
    const patient = await Patient.findById(currentUser.patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }
    console.log("Patient profile found:", patient.name);
    res.json({ 
      success: true, 
      data: patient 
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching patient profile" 
    });
  }
};

// Get patient's appointments
export const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id ;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        message: "Patient ID not found" 
      });
    }

    const Patientappointments = await Appointment.find({ patientID: patientId })
      .populate('doctorID',)
      .sort({ appointmentDate: 1 });

    console.log(Patientappointments)
    
    res.json({ 
      success: true, 
      data:Patientappointments 
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching appointments" 
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const currentUser = await userModel.findById(req.user.id);
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Check user role
    const isDoctor = currentUser.role === 'doctor';
    const isPatient = currentUser.role === 'patient';
    const isAdmin = currentUser.role === 'admin';

    // Authorization based on role
    if (isAdmin) {
      // Admin can update any appointment to any status
      const allowedStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
    } else if (isDoctor) {
      // Doctor must own this appointment
      if (appointment.doctorID.toString() !== currentUser.doctorId.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
      // Doctor can do: confirm, complete, cancel, reschedule
      const allowedStatuses = ['confirmed', 'completed', 'cancelled', 'rescheduled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
    } else if (isPatient) {
      // Patient must own this appointment
      if (appointment.patientID.toString() !== currentUser.patientId.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
      // Patient can only cancel
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: "Patients can only cancel appointments" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update the appointment status
    appointment.status = status;
    
    // When appointment is completed, automatically mark payment as paid
    if (status === 'completed') {
      appointment.paymentStatus = 'paid';
    }
    
    await appointment.save();

    res.json({ 
      success: true, 
      message: `Appointment ${status} successfully${status === 'completed' ? ' and payment marked as paid' : ''}`, 
      data: appointment 
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating appointment status" 
    });
  }
};


// Get patient dashboard data
export const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        message: "Patient ID not found" 
      });
    }

    // Get patient data
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({ 
      patient: patientId,
      appointmentDate: { $gte: new Date() }
    })
    .populate('doctorID', 'name specialization')
    .sort({ appointmentDate: 1 })
    .limit(5);

    // Get recent appointments
    const recentAppointments = await Appointment.find({ 
      patient: patientId,
      appointmentDate: { $lt: new Date() }
    })
    .populate('doctorID', 'name specialization')
    .sort({ appointmentDate: -1 })
    .limit(3);

    const dashboardData = {
      success: true,
      patient: {
        _id: patient._id,
        mrn: patient.mrn,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        status: patient.status,
        phone: patient.phone,
        email: patient.email
      },
      stats: {
        totalAppointments: await Appointment.countDocuments({ patient: patientId }),
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments: await Appointment.countDocuments({ 
          patient: patientId, 
          status: 'completed' 
        })
      },
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt._id,
        doctor: apt.doctor?.name || 'Doctor',
        specialization: apt.doctor?.specialization || 'General',
        date: apt.appointmentDate.toISOString().split('T')[0],
        time: apt.appointmentTime,
        type: apt.type,
        status: apt.status
      })),
      recentAppointments: recentAppointments.map(apt => ({
        id: apt._id,
        doctor: apt.doctor?.name || 'Doctor',
        date: apt.appointmentDate.toISOString().split('T')[0],
        time: apt.appointmentTime,
        type: apt.type,
        status: apt.status
      })),
      medicalAlerts: patient.allergies && patient.allergies.length > 0 ? [
        {
          type: "Allergy",
          message: `Allergic to: ${patient.allergies.join(', ')}`,
          priority: "high"
        }
      ] : []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Patient dashboard error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching patient dashboard" 
    });
  }
};
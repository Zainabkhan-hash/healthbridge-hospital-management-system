import Doctor from "../models/doctorsModel.js";
import Appointment from "../models/appointmentModel.js";
import User from "../models/userModel.js";
import doctorsModel from "../models/doctorsModel.js";
import userModel from "../models/userModel.js";

// Get all doctors with filters
export const getDoctors = async (req, res) => {
  try {
    const { search, specialization, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { qualification: { $regex: search, $options: "i" } }
      ];
    }
    
    if (specialization) filter.specialization = specialization;
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const doctors = await Doctor.find(filter)
      .select('-__v')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Doctor.countDocuments(filter);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalDoctors: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors"
    });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor"
    });
  }
};

// Create doctor (Admin only)
export const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, qualification, experience, licenseNumber, phone, address, consultationFee } = req.body;

    // Check if doctor with license exists
    const doctorExists = await Doctor.findOne({ licenseNumber });
    if (doctorExists) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this license number already exists"
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    // Create user first
    const user = await User.create({
      name,
      email,
      password,
      role: "doctor"
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      user: user._id,
      name,
      specialization,
      qualification,
      experience,
      licenseNumber,
      phone,
      email,
      address,
      consultationFee
    });

    // Update user with doctorId
    user.doctorId = doctor._id;
    await user.save();

    const doctorResponse = await Doctor.findById(doctor._id)
      .select('-__v');

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        doctor: doctorResponse,
        loginCredentials: {
          email: email,
          password: password // Note: In production, send this via email
        }
      }
    });

  } catch (error) {
    console.error("Create doctor error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value entered"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating doctor"
    });
  }
};

// Update doctor
export const updateDoctor = async (req, res) => {
  try {
    const { name, specialization, qualification, experience, phone, address, consultationFee, status } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        name,
        specialization,
        qualification,
        experience,
        phone,
        address,
        consultationFee,
        status
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Update user name if changed
    if (name) {
      await User.findByIdAndUpdate(doctor.user, { name });
    }

    res.json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor
    });

  } catch (error) {
    console.error("Update doctor error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value entered"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating doctor"
    });
  }
};

// Delete doctor
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(doctor.user);
    
    // Delete doctor
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Doctor deleted successfully"
    });

  } catch (error) {
    console.error("Delete doctor error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting doctor"
    });
  }
};

// Get doctor's availability
export const getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('status');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Get today's appointments to calculate availability
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await Appointment.countDocuments({
      doctor: req.params.id,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    const availability = {
      status: doctor.status,
      todaysAppointments,
      isAvailable: doctor.status === 'Available' && todaysAppointments < 20 // Assuming max 20 appointments per day
    };

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error("Get doctor availability error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor availability"
    });
  }
};

export const getDoctorDashboard = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Find doctor's profile using current user
    const doctor = await userModel.findOne({ user: currentUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's appointments
    const todaysAppointments = await Appointment.find({
      doctorID: doctor.doctorId,
      appointmentDate: { $gte: todayStart, $lt: todayEnd },
    })
      .populate("patient", "name mrn phone age gender")
      .sort({ appointmentTime: 1 });

    // Upcoming appointments
    const upcomingAppointments = await Appointment.find({
      doctorID: doctor.doctorId,
      appointmentDate: { $gt: todayEnd },
      status: { $in: ["scheduled", "confirmed"] },
    })
      .populate("patient", "name mrn phone age gender")
      .sort({ appointmentDate: 1 })
      .limit(10);

    // Monthly earnings
    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          doctorID: doctor.doctorId,
          status: "completed",
          paymentStatus: "paid",
          appointmentDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$consultationFee" } } },
    ]);

    // Appointment stats
    const appointmentStats = await Appointment.aggregate([
      { $match: { doctorID: doctor.doctorId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
      totalAppointments: await Appointment.countDocuments({ doctorID: doctor.doctorId }),
      todaysAppointments: todaysAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      monthlyEarnings: monthlyEarnings[0]?.total || 0,
      totalEarnings: doctor.totalEarnings || 0,
    };

    res.json({
      success: true,
      doctor: {
        _id: doctor.doctorId,
        name: doctor.name,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        consultationFee: doctor.consultationFee,
        status: doctor.status,
      },
      stats,
      todaysAppointments,
      upcomingAppointments,
      appointmentStats: appointmentStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor dashboard",
    });
  }
};


// Search doctors
export const searchDoctors = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const doctors = await Doctor.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { specialization: { $regex: q, $options: "i" } },
        { qualification: { $regex: q, $options: "i" } }
      ]
    })
    .select('name specialization qualification consultationFee status')
    .limit(10);

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error("Search doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching doctors"
    });
  }
};
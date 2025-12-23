import User from "../models/userModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorsModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (user) => {
  return jwt.sign({ 
    id: user._id, 
    role: user.role,
    patientId: user.patientId,
    doctorId: user.doctorId
  }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Patient Registration
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, cnic, address, bloodGroup } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email" 
      });
    }

    // Check if patient with CNIC exists
    const patientExists = await Patient.findOne({ cnic });
    if (patientExists) {
      return res.status(400).json({ 
        success: false,
        message: "Patient with this CNIC already exists" 
      });
    }

    // Generate MRN
    const lastPatient = await Patient.findOne().sort({ createdAt: -1 });
    let newMRN = "MRN001";
    if (lastPatient && lastPatient.mrn) {
      const lastNumber = parseInt(lastPatient.mrn.replace("MRN", ""));
      newMRN = `MRN${(lastNumber + 1).toString().padStart(3, "0")}`;
    }

    // Create patient
    const patient = await Patient.create({
      mrn: newMRN,
      name,
      cnic,
      phone,
      age,
      gender,
      email,
      address,
      bloodGroup
    });

    // Create user account
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: "patient",
      patientId: patient._id
    });

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patientId
      }
    });

  } catch (error) {
    console.error("Patient registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Duplicate field value entered" 
      });
    }
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
};

// Create Doctor (Admin only)
export const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, qualification, experience, licenseNumber, phone, address, consultationFee } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email" 
      });
    }

    // Check if doctor with license exists
    const doctorExists = await Doctor.findOne({ licenseNumber });
    if (doctorExists) {
      return res.status(400).json({ 
        success: false,
        message: "Doctor with this license number already exists" 
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

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: {
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee
        },
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
      message: "Server error: " + error.message 
    });
  }
};

// Login user 
export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    console.log("Login attempt:", { email, role });
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Role check
    if (role && user.role !== role) {
      return res.status(401).json({ 
        success: false,
        message: `Please login as ${user.role}` 
      });
    }

    // Success response
    res.json({
      success: true,
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: user.patientId,
        doctorId: user.doctorId
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
};
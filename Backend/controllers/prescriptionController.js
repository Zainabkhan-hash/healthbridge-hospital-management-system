import Prescription from "../models/prescriptionModel.js";
import Appointment from "../models/appointmentModel.js";

// Create new prescription
export const createPrescription = async (req, res) => {
  try {
    const { appointment, patient, doctor, medications, diagnosis, instructions, followUpDate } = req.body;

    const prescription = await Prescription.create({
      appointment,
      patient,
      doctor,
      medications,
      diagnosis,
      instructions,
      followUpDate
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name mrn age gender')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate appointmentTime');

    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: populatedPrescription
    });
  } catch (error) {
    console.error("Create prescription error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating prescription"
    });
  }
};

// Get all prescriptions with filters
export const getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, patient, doctor, date } = req.query;
    
    let filter = {};
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'name mrn age gender')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Prescription.countDocuments(filter);

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalPrescriptions: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Get prescriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prescriptions"
    });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name mrn age gender bloodGroup allergies')
      .populate('doctor', 'name specialization qualification licenseNumber')
      .populate('appointment', 'appointmentDate appointmentTime type reason');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error("Get prescription error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prescription"
    });
  }
};

// Get patient's prescriptions
export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error("Get patient prescriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient prescriptions"
    });
  }
};

// Get my prescriptions (for logged-in patient)
export const getMyPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization qualification')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error("Get my prescriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prescriptions"
    });
  }
};

// Update prescription
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patient', 'name mrn age gender')
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentDate appointmentTime');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription
    });
  } catch (error) {
    console.error("Update prescription error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating prescription"
    });
  }
};

// Delete prescription
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    res.json({
      success: true,
      message: "Prescription deleted successfully"
    });
  } catch (error) {
    console.error("Delete prescription error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting prescription"
    });
  }
};

// Request prescription refill
export const requestRefill = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found"
      });
    }

    prescription.refillRequested = true;
    prescription.refillRequestDate = new Date();
    await prescription.save();

    res.json({
      success: true,
      message: "Refill requested successfully",
      data: prescription
    });
  } catch (error) {
    console.error("Request refill error:", error);
    res.status(500).json({
      success: false,
      message: "Error requesting refill"
    });
  }
};
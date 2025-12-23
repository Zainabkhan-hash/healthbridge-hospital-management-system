import Appointment from "../models/appointmentModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorsModel.js";
import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const {date, time } = req.body;
     console.log(req.body.doctorId)
    
     console.log(req.body)

    // Get doctor's consultation fee
    const doctorData = await Doctor.findById(req.body.doctorId);
    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
     
    const curruntUser = await userModel.findById(req.user.id)
    console.log()
    const appointment = await Appointment.create({
      doctorID: doctorData._id,
      patientID:curruntUser.patientId,
      appointmentDate:date,
      appointmentTime:time,
      location:doctorData.address,
      consultationFee: doctorData.consultationFee
    });
    
    // const populatedAppointment = await Appointment.findById(appointment._id)
    //   .populate('patient', 'name mrn phone email')
    //   .populate('doctor', 'name specialization consultationFee');

    res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      data: appointment
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating appointment"
    });
  }
};

// Get all appointments with filters
export const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctor, patient, date } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const appointments = await Appointment.find(filter)
      .populate('patientID', 'name mrn phone email')
      .populate('doctorID', 'name specialization consultationFee')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalAppointments: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments"
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('patient', 'name mrn phone email')
     .populate('doctor', 'name specialization consultationFee');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // If appointment is completed, update financials
    if (status === 'completed' && appointment.paymentStatus === 'paid') {
      await Patient.findByIdAndUpdate(appointment.patient._id, {
        $inc: { totalSpent: appointment.consultationFee }
      });
      
      await Doctor.findByIdAndUpdate(appointment.doctor._id, {
        $inc: { totalEarnings: appointment.consultationFee }
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: appointment
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment"
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true, runValidators: true }
    ).populate('patient', 'name mrn phone email')
     .populate('doctor', 'name specialization consultationFee');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: appointment
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status"
    });
  }
};

export const getDoctorAppointments = async (req, res) => {
  try {
    // The logged-in user
    const userId = req.user.id;

    // Get the user details (which include doctorId)
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const doctorID = user.doctorId;  // doctorId from user document

    if (!doctorID) {
      return res.status(400).json({
        success: false,
        message: "This user is not a doctor"
      });
    }

    console.log("Doctor ID:", doctorID);

    // NOW get doctor appointments correctly
    const appointments = await appointmentModel
      .find({ doctorID: doctorID })  // <-- correct filter
      .populate("patientID")
      .sort({ appointmentDate: 1 });
    console.log(appointments)
    console.log("Appointments found:", appointments.length);
    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error("Get doctor appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments"
    });
  }
};


// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctorID', 'name specialization qualification consultationFee')
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments"
    });
  }
};
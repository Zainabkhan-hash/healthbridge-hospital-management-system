import LabReport from "../models/labReportModel.js";

// Create new lab report
export const createLabReport = async (req, res) => {
  try {
    const { patient, doctor, testType, testDetails, instructions, urgency } = req.body;

    const labReport = await LabReport.create({
      patient,
      doctor,
      testType,
      testDetails,
      instructions,
      urgency,
      orderedBy: req.user.id
    });

    const populatedReport = await LabReport.findById(labReport._id)
      .populate('patient', 'name mrn age gender')
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: "Lab report created successfully",
      data: populatedReport
    });
  } catch (error) {
    console.error("Create lab report error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating lab report"
    });
  }
};

// Get all lab reports with filters
export const getLabReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, patient, doctor, status, testType } = req.query;
    
    let filter = {};
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;
    if (testType) filter.testType = { $regex: testType, $options: 'i' };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const labReports = await LabReport.find(filter)
      .populate('patient', 'name mrn age gender')
      .populate('doctor', 'name specialization')
      .populate('orderedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await LabReport.countDocuments(filter);

    res.json({
      success: true,
      data: labReports,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReports: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Get lab reports error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lab reports"
    });
  }
};

// Get lab report by ID
export const getLabReportById = async (req, res) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('patient', 'name mrn age gender bloodGroup')
      .populate('doctor', 'name specialization qualification')
      .populate('orderedBy', 'name');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: "Lab report not found"
      });
    }

    res.json({
      success: true,
      data: labReport
    });
  } catch (error) {
    console.error("Get lab report error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lab report"
    });
  }
};

// Get patient's lab reports
export const getPatientLabReports = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    const labReports = await LabReport.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('orderedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: labReports
    });
  } catch (error) {
    console.error("Get patient lab reports error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient lab reports"
    });
  }
};

// Get my lab reports (for logged-in patient)
export const getMyLabReports = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    
    const labReports = await LabReport.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('orderedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: labReports
    });
  } catch (error) {
    console.error("Get my lab reports error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lab reports"
    });
  }
};

// Update lab report
export const updateLabReport = async (req, res) => {
  try {
    const labReport = await LabReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patient', 'name mrn age gender')
    .populate('doctor', 'name specialization')
    .populate('orderedBy', 'name');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: "Lab report not found"
      });
    }

    res.json({
      success: true,
      message: "Lab report updated successfully",
      data: labReport
    });
  } catch (error) {
    console.error("Update lab report error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating lab report"
    });
  }
};

// Upload lab result
export const uploadResult = async (req, res) => {
  try {
    const { results, findings, normalRange, attachments } = req.body;

    const labReport = await LabReport.findByIdAndUpdate(
      req.params.id,
      {
        results,
        findings,
        normalRange,
        attachments,
        status: 'completed',
        completedDate: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('patient', 'name mrn age gender')
    .populate('doctor', 'name specialization');

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: "Lab report not found"
      });
    }

    res.json({
      success: true,
      message: "Lab results uploaded successfully",
      data: labReport
    });
  } catch (error) {
    console.error("Upload lab result error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading lab results"
    });
  }
};

// Delete lab report
export const deleteLabReport = async (req, res) => {
  try {
    const labReport = await LabReport.findByIdAndDelete(req.params.id);

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: "Lab report not found"
      });
    }

    res.json({
      success: true,
      message: "Lab report deleted successfully"
    });
  } catch (error) {
    console.error("Delete lab report error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting lab report"
    });
  }
};
import MedicalRecord from "../models/medicalRecordModel.js";

// Create new medical record
export const createMedicalRecord = async (req, res) => {
  try {
    const { patient, title, recordType, description, date, attachments } = req.body;

    const medicalRecord = await MedicalRecord.create({
      patient,
      title,
      recordType,
      description,
      date,
      attachments,
      createdBy: req.user.id
    });

    const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
      .populate('patient', 'name mrn age gender')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: populatedRecord
    });
  } catch (error) {
    console.error("Create medical record error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating medical record"
    });
  }
};

// Get all medical records with filters
export const getMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, patient, recordType } = req.query;
    
    let filter = {};
    if (patient) filter.patient = patient;
    if (recordType) filter.recordType = recordType;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const medicalRecords = await MedicalRecord.find(filter)
      .populate('patient', 'name mrn age gender')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      success: true,
      data: medicalRecords,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Get medical records error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medical records"
    });
  }
};

// Get medical record by ID
export const getMedicalRecordById = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name mrn age gender bloodGroup allergies')
      .populate('createdBy', 'name');

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found"
      });
    }

    res.json({
      success: true,
      data: medicalRecord
    });
  } catch (error) {
    console.error("Get medical record error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medical record"
    });
  }
};

// Get patient's medical records
export const getPatientRecords = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    const medicalRecords = await MedicalRecord.find({ patient: patientId })
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: medicalRecords
    });
  } catch (error) {
    console.error("Get patient medical records error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient medical records"
    });
  }
};

// Get my medical records (for logged-in patient)
export const getMyRecords = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    
    const medicalRecords = await MedicalRecord.find({ patient: patientId })
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: medicalRecords
    });
  } catch (error) {
    console.error("Get my medical records error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medical records"
    });
  }
};

// Update medical record
export const updateMedicalRecord = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patient', 'name mrn age gender')
    .populate('createdBy', 'name');

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found"
      });
    }

    res.json({
      success: true,
      message: "Medical record updated successfully",
      data: medicalRecord
    });
  } catch (error) {
    console.error("Update medical record error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating medical record"
    });
  }
};

// Delete medical record
export const deleteMedicalRecord = async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findByIdAndDelete(req.params.id);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found"
      });
    }

    res.json({
      success: true,
      message: "Medical record deleted successfully"
    });
  } catch (error) {
    console.error("Delete medical record error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting medical record"
    });
  }
};

// Upload attachment
export const uploadAttachment = async (req, res) => {
  try {
    const { filename, originalName, fileType, fileSize } = req.body;

    const medicalRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.recordId,
      {
        $push: {
          attachments: {
            filename,
            originalName,
            fileType,
            fileSize,
            uploadedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found"
      });
    }

    res.json({
      success: true,
      message: "Attachment uploaded successfully",
      data: medicalRecord
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading attachment"
    });
  }
};
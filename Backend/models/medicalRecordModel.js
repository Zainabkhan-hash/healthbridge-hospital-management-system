import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
});

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  recordType: {
    type: String,
    enum: [
      'consultation',
      'lab_result',
      'imaging',
      'surgical',
      'vaccination',
      'allergy',
      'chronic_condition',
      'medication',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  hospital: {
    type: String
  },
  diagnosis: {
    type: String
  },
  treatment: {
    type: String
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  attachments: [attachmentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better performance
medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ createdBy: 1 });

export default mongoose.model('MedicalRecord', medicalRecordSchema);
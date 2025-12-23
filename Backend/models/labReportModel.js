import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  unit: {
    type: String
  },
  normalRange: {
    type: String
  },
  flag: {
    type: String,
    enum: ['normal', 'high', 'low', 'critical']
  }
});

const labReportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  testDetails: {
    type: String,
    required: true
  },
  instructions: {
    type: String
  },
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  results: [testResultSchema],
  findings: {
    type: String
  },
  normalRange: {
    type: String
  },
  attachments: [{
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['ordered', 'in-progress', 'completed', 'cancelled'],
    default: 'ordered'
  },
  orderedDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
labReportSchema.index({ patient: 1, createdAt: -1 });
labReportSchema.index({ doctor: 1, createdAt: -1 });
labReportSchema.index({ status: 1 });

export default mongoose.model('LabReport', labReportSchema);
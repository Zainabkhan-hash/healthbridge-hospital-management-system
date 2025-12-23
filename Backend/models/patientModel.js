import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  mrn: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  cnic: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  age: { 
    type: Number, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ["Male", "Female", "Other"], 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Active", "Inactive"], 
    default: "Active" 
  },
  dob: { 
    type: Date 
  },
  emergencyContact: { 
    type: String 
  },
  bloodGroup: { 
    type: String 
  },
  allergies: { 
    type: [String], 
    default: [] 
  },
  medicalHistory: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model("Patient", patientSchema);
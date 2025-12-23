import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  getPatientRecords,
  getMyRecords,
  updateMedicalRecord,
  deleteMedicalRecord,
  uploadAttachment
} from "../controllers/medicalRecordController.js";

const router = express.Router();

router.use(protect);

// Patient routes
router.get("/my-records", authorizeRoles("patient"), getMyRecords);

// Doctor routes
router.get("/patient/:patientId", authorizeRoles("doctor", "admin"), getPatientRecords);
router.post("/", authorizeRoles("doctor", "admin"), createMedicalRecord);

// Admin routes
router.get("/", authorizeRoles("doctor", "admin"), getMedicalRecords);
router.get("/:id", authorizeRoles("doctor", "admin", "patient"), getMedicalRecordById);
router.put("/:id", authorizeRoles("doctor", "admin"), updateMedicalRecord);
router.delete("/:id", authorizeRoles("admin"), deleteMedicalRecord);
router.post("/:recordId/attachments", authorizeRoles("doctor", "admin"), uploadAttachment);

export default router;
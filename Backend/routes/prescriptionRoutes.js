import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPatientPrescriptions,
  getMyPrescriptions,
  updatePrescription,
  deletePrescription,
  requestRefill
} from "../controllers/prescriptionController.js";

const router = express.Router();

router.use(protect);

// Patient routes
router.get("/my-prescriptions", authorizeRoles("patient"), getMyPrescriptions);
router.post("/:id/refill", authorizeRoles("patient"), requestRefill);

// Doctor routes
router.get("/patient/:patientId", authorizeRoles("doctor", "admin"), getPatientPrescriptions);
router.post("/", authorizeRoles("doctor", "admin"), createPrescription);

// Admin routes
router.get("/", authorizeRoles("doctor", "admin"), getPrescriptions);
router.get("/:id", authorizeRoles("doctor", "admin", "patient"), getPrescriptionById);
router.put("/:id", authorizeRoles("doctor", "admin"), updatePrescription);
router.delete("/:id", authorizeRoles("admin"), deletePrescription);

export default router;
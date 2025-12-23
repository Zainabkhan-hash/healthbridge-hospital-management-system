import express from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  bulkDeletePatients,
  getMyProfile,
  getMyAppointments,
  getPatientDashboard,
  updateAppointmentStatus,
  
} from "../controllers/patientController.js";
import { protect} from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js"

const router = express.Router();

router.use(protect); // All routes protected

// Patient-specific routes FIRST (otherwise /:id overrides them)
router.get("/profile/me", authorizeRoles("patient"), getMyProfile);
router.get("/appointments/me", getMyAppointments);
router.put("/appointments/:id", protect, updateAppointmentStatus);
router.get("/dashboard/data", getPatientDashboard);

// Admin routes
router.get("/", getPatients);
router.post("/", createPatient);
router.post("/bulk-delete", bulkDeletePatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;

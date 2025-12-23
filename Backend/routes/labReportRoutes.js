import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createLabReport,
  getLabReports,
  getLabReportById,
  getPatientLabReports,
  getMyLabReports,
  updateLabReport,
  deleteLabReport,
  uploadResult
} from "../controllers/labReportController.js";

const router = express.Router();

router.use(protect);

// Patient routes
router.get("/my-reports", authorizeRoles("patient"), getMyLabReports);

// Doctor routes
router.get("/patient/:patientId", authorizeRoles("doctor", "admin"), getPatientLabReports);
router.post("/", authorizeRoles("doctor", "admin"), createLabReport);
router.put("/:id/upload", authorizeRoles("doctor", "admin"), uploadResult);

// Admin routes
router.get("/", authorizeRoles("doctor", "admin"), getLabReports);
router.get("/:id", authorizeRoles("doctor", "admin", "patient"), getLabReportById);
router.put("/:id", authorizeRoles("doctor", "admin"), updateLabReport);
router.delete("/:id", authorizeRoles("admin"), deleteLabReport);

export default router;
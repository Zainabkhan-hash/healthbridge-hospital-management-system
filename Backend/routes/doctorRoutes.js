import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorAvailability,
  getDoctorDashboard,
  searchDoctors
} from "../controllers/doctorController.js";

const router = express.Router();

// Public routes (accessible by all authenticated users)
router.get("/getalldoctors", protect, getDoctors);
router.get("/search", protect, searchDoctors);
router.get("/:id", protect, getDoctorById);
router.get("/:id/availability", protect, getDoctorAvailability);

// Doctor-specific routes
router.get("/dashboard/data", protect, authorizeRoles("doctor"), getDoctorDashboard);

// Admin-only routes
router.post("/", protect, authorizeRoles("admin"), createDoctor);
router.put("/:id", protect, authorizeRoles("admin"), updateDoctor);
router.delete("/:id", protect, authorizeRoles("admin"), deleteDoctor);

export default router;
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  updatePaymentStatus,
  getDoctorAppointments,
  getPatientAppointments
} from "../controllers/appointmentController.js";

const router = express.Router();

router.use(protect);

// Patient routes
router.get("/my-appointments", authorizeRoles("patient"), getPatientAppointments);
router.post("/", authorizeRoles("patient", "admin"), createAppointment);

// Doctor routes
router.get("/doctor/my-appointments", authorizeRoles("doctor"), getDoctorAppointments);
router.patch("/:id/status", authorizeRoles("doctor", "admin"), updateAppointmentStatus);

// Admin routes
router.get("/", authorizeRoles("admin"), getAppointments);
router.patch("/:id/payment-status", authorizeRoles("admin"), updatePaymentStatus);

export default router;
import express from "express";
import { registerPatient, createDoctor, loginUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register-patient", registerPatient);
router.post("/login", loginUser);
router.post("/create-doctor", protect, authorizeRoles("admin"), createDoctor);

export default router;
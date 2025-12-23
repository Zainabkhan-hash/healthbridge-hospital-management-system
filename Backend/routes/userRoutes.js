import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Example: only admin can access
router.get("/all", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "This is admin only: list of all users" });
});

// Example: patient can access their own data
router.get("/me", protect, authorizeRoles("patient", "doctor", "admin"), (req, res) => {
  res.json({ message: `Hello ${req.user.name}, role: ${req.user.role}` });
});

export default router;

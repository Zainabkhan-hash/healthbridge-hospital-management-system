import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user=decoded.id;
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "User not found" 
        });
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
      };

      console.log(`🔐 Authenticated: ${user.email}, Role: ${user.role}`);
      
      next();
    } catch (error) {
      console.error("❌ Token verification error:", error);
      res.status(401).json({ 
        success: false,
        message: "Not authorized, token failed" 
      });
    }
  } else {
    res.status(401).json({ 
      success: false,
      message: "Not authorized, no token" 
    });
  }
};
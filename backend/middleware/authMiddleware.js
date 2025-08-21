import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  console.log("Auth Middleware: Checking for token...");
  // Check if token exists in cookies
  if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      console.log("Auth Middleware: User found:", req.user.username);
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      
      // Clear invalid cookie
      res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      });
      
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
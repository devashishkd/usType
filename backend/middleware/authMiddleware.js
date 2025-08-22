import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;
  console.log("Auth Middleware: Checking for token...");
  console.log("Cookies received:", req.cookies);
  console.log("Origin:", req.get('origin'));
  console.log("User-Agent:", req.get('user-agent'));
  
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
      const isProduction = process.env.NODE_ENV === "production";
      res.cookie("token", "", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        expires: new Date(0),
      });
      
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
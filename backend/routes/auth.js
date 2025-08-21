import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Helper function to set cookie options
const getCookieOptions = () => {
  return {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  };
};

router.post("/register",  async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check if user exists
    const userExists = await User.findOne({ username });
    
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Create user
    const user = await User.create({
      username,
      password,
    });
    
    if (user) {
      const token = generateToken(user._id);
      
      // Set cookie
      res.cookie("token", token, getCookieOptions());
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        message: "User registered successfully"
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Check for user
    const user = await User.findOne({ username });
    console.log(User);
    
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      
      // Set cookie
      res.cookie("token", token, getCookieOptions());
      
      res.json({
        _id: user._id,
        username: user.username,
        message: "Login successful"
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/logout", (req, res) => {
  if(req.cookies.token) {
    res.clearCookie("token", getCookieOptions());
    res.json({ message: "Logout successful" });
  } else {
    res.status(400).json({ message: "No user is logged in" });
  }
});


router.get("/me", protect, async (req, res) => {
  try {
    console.log(req.user._id);
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

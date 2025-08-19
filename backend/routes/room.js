import express from "express";
import Room from "../models/Room.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Create a new room
// @route   POST /api/room
// @access  Private
router.post("/", protect, async (req, res) => {
  const { name, text } = req.body;
  
  try {
    const room = await Room.create({
      name,
      text,
      participants: [],
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all rooms
// @route   GET /api/room
// @access  Public
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({}).populate("participants", "username");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get room by ID
// @route   GET /api/room/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("participants", "username");
    
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Join a room
// @route   PUT /api/room/:id/join
// @access  Private
router.put("/:id/join", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (room) {
      // Check if user is already in the room
      if (room.participants.includes(req.user._id)) {
        return res.status(400).json({ message: "User already in room" });
      }
      
      room.participants.push(req.user._id);
      await room.save();
      
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Leave a room
// @route   PUT /api/room/:id/leave
// @access  Private
router.put("/:id/leave", protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (room) {
      // Check if user is in the room
      if (!room.participants.includes(req.user._id)) {
        return res.status(400).json({ message: "User not in room" });
      }
      
      room.participants = room.participants.filter(
        (participant) => participant.toString() !== req.user._id.toString()
      );
      await room.save();
      
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
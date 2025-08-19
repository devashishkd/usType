import express from "express";
import Room from "../models/Room.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Create a new room
// @route   POST /api/room
// @access  Private
router.post("/", protect, async (req, res) => {
  const { text } = req.body;
  
  try {
    // Generate a unique 6-digit roomId
    let roomId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate a 6-digit random number
      roomId = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if this roomId already exists
      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({ message: "Failed to generate unique roomId after maximum attempts" });
    }
    
    const room = new Room({
      roomId,
      name: roomId, // Set room name to roomId
      text,
      participants: [],
    });
    
    await room.save();
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
    const room = await Room.findOne({ roomId: req.params.id }).populate("participants", "username");
    
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
    const room = await Room.findOne({ roomId: req.params.id });
    
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
    const room = await Room.findOne({ roomId: req.params.id });
    
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
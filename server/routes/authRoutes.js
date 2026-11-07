
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check required fields
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // Only students and researchers can register
    if (!["student", "researcher"].includes(role)) {
      return res.status(400).json({
        message: "Invalid registration role.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      message: "Registration successful!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    return res.status(500).json({
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Please provide email and password.",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
});

// PROTECTED PROFILE ROUTE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully!",
      user,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve profile.",
    });
  }
});


// GET ALL USERS (ADMIN ONLY)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    // Check administrator role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    // Retrieve students and researchers only
    const users = await User.find({
      role: { $in: ["student", "researcher"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Users retrieved successfully!",
      users,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve users.",
      error: error.message,
    });
  }
});

// DELETE USER (ADMIN ONLY)
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    // Check administrator role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Protect administrator accounts
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Administrator accounts cannot be deleted here.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "User deleted successfully!",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user.",
      error: error.message,
    });
  }
});


module.exports = router;

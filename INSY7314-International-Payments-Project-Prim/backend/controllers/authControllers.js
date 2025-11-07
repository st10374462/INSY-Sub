const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const { 
  generateToken, 
  invalidateToken,
  invalidateAllUserTokens 
} = require("../middlewares/authMiddleware.js");

/**
 * POST: Register new user
 * Note: Validation is handled by validateUserInput middleware
 */
const register = async (req, res) => {
  try {
    console.log('🔍 Registration attempt with data:', {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password ? '***REDACTED***' : 'MISSING',
      role: req.body.role
    });
    
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Email already registered:', email);
      return res.status(400).json({ message: "Email already registered" });
    }

    console.log('✅ Email available, creating user...');
    
    const user = await User.create({
      name,
      email,
      password, // Will be hashed by User model pre-save hook
      role: role || "customer",
    });

    console.log('✅ User created with ID:', user._id);
    console.log('🔐 Generating token...');

    const token = await generateToken(user);
    console.log('✅ Token generated successfully');

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * POST: Login user
 */
const login = async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ User found, checking password...');
    
    // Use the comparePassword method from User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password incorrect for:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ Password correct, generating token...');
    const token = await generateToken(user);
    console.log('✅ Login successful for:', email);

    res.json({
      message: "Login successful",
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ 
      message: "Login failed",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

/**
 * POST: Logout user
 */
const logout = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    await invalidateToken(token);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ message: "Logout failed" });
  }
};

/**
 * GET: Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("❌ getProfile error:", err);
    res.status(500).json({ message: "Could not fetch profile" });
  }
};

/**
 * PUT: Update user profile
 * Note: Validation handled by validateUserInput middleware
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password if provided (will trigger token invalidation)
    if (password) {
      user.password = password; // Will be hashed by pre-save hook
      await invalidateAllUserTokens(user._id);
    }

    // Update other fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ["admin", "employee", "customer"].includes(role)) {
      user.role = role;
    }

    await user.save();

    res.json({
      message: "User updated successfully",
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * DELETE: Remove a user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: "No user found with that ID" });
    }

    await invalidateAllUserTokens(id);

    res.status(202).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
};

/**
 * POST: Refresh token stub (to implement later)
 */
const refreshToken = async (req, res) => {
  res.json({ message: "Refresh token endpoint (not implemented yet)" });
};

// ✅ Export all functions
module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateUser,
  deleteUser,
  refreshToken
};
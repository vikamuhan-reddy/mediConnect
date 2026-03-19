const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");


const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, guardian_email } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Link patient to guardian if guardian_email provided
    let guardian_id = null;
    if (role === 'patient' && guardian_email) {
      const guardian = await User.findOne({ email: guardian_email, role: 'guardian' });
      if (guardian) guardian_id = guardian._id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashedPassword, role, phone, guardian_id
    });

    res.status(201).json({
      message: "User registered",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
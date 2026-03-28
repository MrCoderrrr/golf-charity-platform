const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const AuditLog = require("../models/auditLog.model");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
      totalEarnings: user.totalEarnings,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user?.banned) {
      return res.status(403).json({ message: "Account banned" });
    }
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
      totalEarnings: user.totalEarnings,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bootstrapAdmin = async (req, res) => {
  try {
    const { email, password, adminKey, name } = req.body || {};

    const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY || "12345";
    if (!adminKey || adminKey !== expectedKey) {
      return res.status(403).json({ message: "Invalid admin key." });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    let outUser = null;

    if (!user) {
      outUser = await User.create({
        name: String(name || normalizedEmail.split("@")[0] || "Admin").trim(),
        email: normalizedEmail,
        password: String(password),
        role: "admin",
      });
    } else {
      if (user.banned) {
        return res.status(403).json({ message: "Account banned" });
      }
      const ok = await user.comparePassword(String(password));
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      user.role = "admin";
      await user.save();
      outUser = user;
    }

    await AuditLog.create({
      actorUserId: null,
      action: "admin.bootstrap",
      entityType: "User",
      entityId: outUser._id,
      meta: { email: normalizedEmail },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({
      _id: outUser._id,
      name: outUser.name,
      email: outUser.email,
      role: outUser.role,
      isAdmin: outUser.role === "admin",
      totalEarnings: outUser.totalEarnings,
      token: generateToken(outUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

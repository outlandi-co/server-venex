import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Missing fields" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "customer"
    })

    res.json({
      msg: "User registered",
      user: {
        username: user.username,
        role: user.role
      }
    })

  } catch (err) {
    console.error("❌ REGISTER ERROR:", err)
    res.status(500).json({ msg: "Server error" })
  }
})

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ msg: "Missing email or password" })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ msg: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" })
    }

    /* 🔥 THIS IS THE IMPORTANT PART */
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || "supersecretkey123",
      { expiresIn: "7d" }
    )

    /* 🔥 RETURN CLEAN RESPONSE */
    res.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    })

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err)
    res.status(500).json({ msg: "Server error" })
  }
})

export default router
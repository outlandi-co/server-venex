import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

/* ================= HELPER ================= */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.name
    },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" }
  )
}

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  console.log("🔥 BODY RECEIVED:", req.body)

  try 
  
  {
    let { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" })
    }

    email = email.toLowerCase().trim()

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: "User already exists" })
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin creation not allowed" })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashed,
      role: role === "coordinator" ? "coordinator" : "vendor",

      /* 🔥 NEW */
      approved: false
    })

    res.status(201).json({
      message: "Account created. Awaiting approval.",
      user: {
        id: user._id,
        username: user.name,
        role: user.role,
        email: user.email,
        approved: user.approved
      }
    })

  } catch (err) {
    console.error("REGISTER ERROR:", err)
    res.status(500).json({ message: "Register error" })
  }
})

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" })
    }

    email = email.toLowerCase().trim()

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    /* 🔥 BLOCK IF NOT APPROVED */
    if (!user.approved && user.role !== "admin") {
      return res.status(403).json({
        message: "Account pending admin approval"
      })
    }

    const token = generateToken(user)

    res.json({
      token,
      user: {
        id: user._id,
        username: user.name,
        role: user.role,
        email: user.email,
        approved: user.approved
      }
    })

  } catch (err) {
    console.error("LOGIN ERROR:", err)
    res.status(500).json({ message: "Login error" })
  }
})

export default router
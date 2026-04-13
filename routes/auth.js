import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

/* REGISTER */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      username,
      email,
      password: hashed,
      role
    })

    res.json(user)

  } catch (err) {
    res.status(500).json(err)
  }
})

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ msg: "User not found" })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ msg: "Wrong password" })

    const token = jwt.sign(
      { id: user._id },
      "secret123",
      { expiresIn: "7d" }
    )

    res.json({ token, user })

  } catch (err) {
    res.status(500).json(err)
  }
})

export default router
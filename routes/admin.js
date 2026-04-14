import express from "express"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

/* 🔥 GET ALL USERS */
router.get("/users", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" })
  }

  const users = await User.find().select("-password")
  res.json(users)
})

/* 🔥 APPROVE USER */
router.put("/approve/:id", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" })
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }

  user.approved = true
  await user.save()

  res.json({ message: "User approved" })
})

export default router
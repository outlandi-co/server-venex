import express from "express"
import Subscriber from "../models/Subscriber.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    console.log("📩 /api/subscribe BODY:", req.body)

    const { firstName, lastName, email, eventId } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message: "First name, last name, and email are required"
      })
    }

    const subscriber = await Subscriber.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      eventId: eventId ? String(eventId).trim() : ""
    })

    console.log("✅ Subscriber saved:", subscriber._id)

    return res.status(201).json({
      message: "Subscriber saved",
      subscriber
    })
  } catch (err) {
    console.error("❌ SUBSCRIBE ROUTE ERROR:", err)
    return res.status(500).json({
      message: "Error saving subscriber",
      error: err.message
    })
  }
})

export default router
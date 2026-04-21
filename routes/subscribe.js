import express from "express"
import Subscriber from "../models/Subscriber.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    console.log("📩 SUBSCRIBE BODY:", req.body)

    const { firstName, lastName, email, eventId } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message: "First name, last name, and email are required"
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    /* 🔥 CHECK IF ALREADY EXISTS */
    const existing = await Subscriber.findOne({ email: normalizedEmail })

    if (existing) {
      console.log("⚠️ Already subscribed:", normalizedEmail)

      return res.status(200).json({
        message: "Already subscribed",
        subscriber: existing
      })
    }

    /* ✅ CREATE NEW */
    const subscriber = await Subscriber.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      eventId: eventId || ""
    })

    console.log("✅ SUBSCRIBER SAVED:", subscriber._id)

    return res.status(201).json({
      message: "Subscription saved",
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
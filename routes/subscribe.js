import express from "express"
import Subscriber from "../models/Subscriber.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, eventId } = req.body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message: "First name, last name, and email are required"
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedEventId = eventId || ""

    const existing = await Subscriber.findOne({
      email: normalizedEmail,
      eventId: normalizedEventId
    })

    if (existing) {
      return res.status(200).json({
        message: "Already subscribed",
        subscriber: existing
      })
    }

    const sub = await Subscriber.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      eventId: normalizedEventId
    })

    return res.status(201).json({
      message: "Subscription saved",
      subscriber: sub
    })
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err)
    return res.status(500).json({ message: "Error saving subscriber" })
  }
})

export default router
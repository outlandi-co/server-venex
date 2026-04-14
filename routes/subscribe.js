import express from "express"
import Subscriber from "../models/Subscriber.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, eventId } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email required" })
    }

    const sub = await Subscriber.create({
      firstName,
      lastName,
      email,
      eventId
    })

    res.json(sub)

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error saving subscriber" })
  }
})

export default router
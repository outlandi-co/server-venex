import express from "express"
import Event from "../models/Event.js"

const router = express.Router()

/* GET EVENTS */
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 })
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: "Error loading events" })
  }
})

/* CREATE EVENT */
router.post("/", async (req, res) => {
  try {
    const { title, description, roomId, createdBy } = req.body

    const event = await Event.create({
      title,
      description,
      roomId,
      createdBy
    })

    res.json(event)
  } catch (err) {
    res.status(500).json({ message: "Error creating event" })
  }
})

export default router
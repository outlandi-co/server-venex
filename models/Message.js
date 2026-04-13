import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import Message from "./models/Message.js"

dotenv.config()

const app = express()

app.use(cors({ origin: "*", credentials: true }))
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "*" }
})

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id)

  /* JOIN ROOM */
  socket.on("joinRoom", async ({ room, username }) => {
    if (!room) return

    socket.join(room)

    console.log(`📡 ${username} joined ${room}`)

    const messages = await Message.find({ room }).sort({ createdAt: 1 })

    console.log("📦 Loaded:", messages.length)

    socket.emit("loadMessages", messages)
  })

  /* SEND MESSAGE */
  socket.on("sendMessage", async (data) => {
    try {
      if (!data?.room || !data?.text) return

      const newMessage = await Message.create({
        room: data.room,
        username: data.username,
        text: data.text,
        role: data.role || "guest",
        type: data.type || "general",
        category: data.category || "general"
      })

      console.log("💾 Saved:", newMessage)

      /* 🔥 SEND ONLY TO ROOM */
      io.to(data.room).emit("newMessage", newMessage)

    } catch (err) {
      console.error("❌ Save error:", err)
    }
  })
})

app.get("/", (req, res) => {
  res.json({ message: "Venex API running 🚀" })
})

const PORT = process.env.PORT || 5051

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Mongo connected")

    server.listen(PORT, () => {
      console.log(`🚀 Running on ${PORT}`)
    })
  })
  .catch(err => console.error(err))
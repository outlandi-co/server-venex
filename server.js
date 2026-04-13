import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"

import Message from "./models/Message.js"
import authRoutes from "./routes/auth.js"

dotenv.config()

const app = express()

app.use(cors({
  origin: "*",
  credentials: true
}))

app.use(express.json())

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes)

/* ================= SERVER ================= */
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

/* 🔐 JWT HELPER */
const getUserFromToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "secret123")
  } catch {
    return null
  }
}

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id)

  socket.on("joinRoom", async ({ room, username, role, token }) => {
    if (!room) return

    const decoded = getUserFromToken(token)

    const safeUser = {
      username: username || decoded?.username || "Guest",
      role: role || decoded?.role || "guest"
    }

    socket.join(room)

    socket.data.username = safeUser.username
    socket.data.role = safeUser.role
    socket.data.userId = decoded?.id || null

    console.log(`📡 ${safeUser.username} joined ${room}`)

    try {
      const messages = await Message.find({ room }).sort({ createdAt: 1 })
      socket.emit("loadMessages", messages)

      const clients = await io.in(room).fetchSockets()

      const users = clients.map(s => ({
  socketId: s.id,
  username: s.data.username,
  role: s.data.role,
  userId: s.data.userId // 👈 ADD THIS
}))
      io.to(room).emit("roomUsers", users)

    } catch (err) {
      console.error("❌ Load error:", err)
    }
  })

  socket.on("sendMessage", async (data) => {
    try {
      if (!data?.room || !data?.text) return

      const newMessage = await Message.create({
        room: data.room,
        username: socket.data.username,
        text: data.text,
        role: socket.data.role,
        type: data.type || "general",
        category: data.category || "general"
      })

      console.log("💾 Saved:", newMessage._id)

      io.to(data.room).emit("newMessage", newMessage)

    } catch (err) {
      console.error("❌ Save error:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id)
  })
})

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.json({ message: "Venex API running 🚀" })
})

/* ================= START ================= */
const PORT = process.env.PORT || 5051

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Mongo connected")

    server.listen(PORT, () => {
      console.log(`🚀 Running on ${PORT}`)
    })
  })
  .catch(err => console.error("❌ Mongo error:", err))
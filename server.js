import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

/* MODELS */
import Message from "./models/Message.js"
import User from "./models/User.js"

/* ROUTES */
import authRoutes from "./routes/auth.js"
import subscribeRoutes from "./routes/subscribe.js"
import eventRoutes from "./routes/events.js"

dotenv.config()

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: "*", credentials: true }))
app.use(express.json())

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes)
app.use("/api/subscribe", subscribeRoutes)
app.use("/api/events", eventRoutes)

/* ================= ADMIN SETUP (SECURE) ================= */
app.post("/api/create-admin", async (req, res) => {
  try {
    const { secret } = req.body

    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    const exists = await User.findOne({ email: "admin@venex.com" })
    if (exists) {
      return res.json({ message: "Admin already exists" })
    }

    const hashed = await bcrypt.hash("admin123", 10)

    const admin = await User.create({
      name: "Admin",
      email: "admin@venex.com",
      password: hashed,
      role: "admin",
      approved: true
    })

    res.json({
      message: "Admin created",
      admin: {
        email: admin.email,
        role: admin.role
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Admin creation failed" })
  }
})

/* ================= SERVER ================= */
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
})

/* JWT */
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

  socket.on("joinRoom", async (data) => {
    const { room, username, role, token } = data || {}
    if (!room) return

    const decoded = getUserFromToken(token)

    const safeUser = {
      username: username || decoded?.username || "Guest",
      role: role || decoded?.role || "guest",
      userId: decoded?.id || null
    }

    socket.join(room)
    socket.data = safeUser

    const messages = await Message.find({ room }).sort({ createdAt: 1 })
    socket.emit("loadMessages", messages)
  })

  socket.on("sendMessage", async (data) => {
    if (!data?.room || !data?.text) return

    const newMessage = await Message.create({
      room: data.room,
      username: socket.data?.username || "Guest",
      role: socket.data?.role || "guest",
      text: data.text,
      type: data.type || "general",
      category: data.category || "general"
    })

    io.to(data.room).emit("newMessage", newMessage)
  })
})

/* ================= START ================= */
const PORT = process.env.PORT || 5051

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Mongo connected")
    server.listen(PORT, () => console.log(`🚀 Running on ${PORT}`))
  })
  .catch(err => console.error("❌ Mongo error:", err))
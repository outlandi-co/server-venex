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

/* ================= CORS ================= */
const CLIENT_URL = process.env.CLIENT_URL || "*"

app.use(cors({
  origin: CLIENT_URL === "*" ? "*" : [CLIENT_URL],
  credentials: true
}))

app.use(express.json())

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes)

/* ================= SERVER ================= */
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL === "*" ? "*" : [CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
})

/* ================= AUTH HELPER ================= */
const getUserFromToken = (token) => {
  try {
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET || "secret123")
  } catch {
    return null
  }
}

/* ================= SOCKET ================= */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id)

  /* JOIN ROOM */
  socket.on("joinRoom", async ({ room, username, role, token }) => {
    if (!room) return

    const decoded = getUserFromToken(token)

    const safeUser = {
      username: username || decoded?.username || "Guest",
      role: role || decoded?.role || "guest"
    }

    socket.join(room)

    console.log(`📡 ${safeUser.username} (${safeUser.role}) joined ${room}`)

    try {
      const messages = await Message.find({ room }).sort({ createdAt: 1 })
      socket.emit("loadMessages", messages)

      /* 🔥 SEND UPDATED USERS LIST */
      const clients = await io.in(room).fetchSockets()

      const users = clients.map(s => ({
        socketId: s.id,
        username: s.data?.username || "Guest",
        role: s.data?.role || "guest"
      }))

      io.to(room).emit("roomUsers", users)

      /* STORE USER ON SOCKET */
      socket.data.username = safeUser.username
      socket.data.role = safeUser.role

    } catch (err) {
      console.error("❌ Load error:", err)
    }
  })

  /* SEND MESSAGE */
  socket.on("sendMessage", async (data) => {
    try {
      if (!data?.room || !data?.text) return

      const newMessage = await Message.create({
        room: data.room,
        username: data.username || socket.data.username || "Guest",
        text: data.text,
        role: data.role || socket.data.role || "guest",
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
  .catch(err => console.error(err))
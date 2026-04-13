import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import Message from "./models/Message.js"

/* 🔥 REDIS */
import { createAdapter } from "@socket.io/redis-adapter"
import { createClient } from "redis"

dotenv.config()

const app = express()

app.use(cors({
  origin: "*",
  credentials: true
}))

app.use(express.json())

const server = http.createServer(app)

/* ================= SOCKET ================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

/* 🔥 CONNECT REDIS */
const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log("⚠️ REDIS_URL not set — single instance mode")
    return
  }

  try {
    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()

    await pubClient.connect()
    await subClient.connect()

    io.adapter(createAdapter(pubClient, subClient))

    console.log("🧠 Redis adapter connected")
  } catch (err) {
    console.error("❌ Redis connection failed:", err)
  }
}

/* ================= SOCKET EVENTS ================= */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id, "PID:", process.pid)

  /* JOIN ROOM */
  socket.on("joinRoom", async ({ room, username }) => {
    if (!room) return

    socket.join(room)

    console.log(`📡 ${username} joined ${room}`)

    try {
      const messages = await Message.find({ room }).sort({ createdAt: 1 })

      console.log("📦 Loaded messages:", messages.length)

      socket.emit("loadMessages", messages)
    } catch (err) {
      console.error("❌ Load messages error:", err)
    }
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

      console.log("💾 Saved:", newMessage._id)

      /* 🔥 ROOM BROADCAST (WORKS WITH REDIS) */
      io.to(data.room).emit("newMessage", newMessage)

    } catch (err) {
      console.error("❌ Save error:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id)
  })
})

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({ message: "Venex API running 🚀" })
})

/* ================= START ================= */
const PORT = process.env.PORT || 5051

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("✅ Mongo connected")

    await initRedis()

    server.listen(PORT, () => {
      console.log(`🚀 Running on ${PORT}`)
    })
  } catch (err) {
    console.error("❌ Startup error:", err)
  }
}

start()
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

/* 🔥 CONNECT REDIS + ATTACH ADAPTER */
const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log("⚠️ REDIS_URL not set — running single-instance mode")
    return
  }

  const pubClient = createClient({ url: process.env.REDIS_URL })
  const subClient = pubClient.duplicate()

  await pubClient.connect()
  await subClient.connect()

  io.adapter(createAdapter(pubClient, subClient))

  console.log("🧠 Redis adapter connected")
}

/* ================= SOCKET EVENTS ================= */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id, "PID:", process.pid)

  /* JOIN ROOM */
  socket.on("joinRoom", async ({ room, username }) => {
    if (!room) return

    socket.join(room)

    console.log(`📡 ${username} joined ${room}`)

    const messages = await Message.find({ room }).sort({ createdAt: 1 })

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

      console.log("💾 Saved:", newMessage._id)

      /* 🔥 BROADCAST VIA REDIS TO ALL INSTANCES */
      io.to(data.room).emit("newMessage", newMessage)

    } catch (err) {
      console.error("❌ Save error:", err)
    }
  })
})

/* ================= ROUTE ================= */
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
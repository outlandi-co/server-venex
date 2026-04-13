import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import Message from "./models/Message.js"

dotenv.config()

console.log("🌐 MONGO_URI LOADED:", !!process.env.MONGO_URI)
console.log("🌐 CLIENT_URL:", process.env.CLIENT_URL)

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}))

app.use(express.json())

/* ================= SERVER ================= */
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
})

/* ================= LIVE USERS STORE ================= */
const roomUsers = {} // { roomId: [{ socketId, username }] }

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id)

  socket.emit("connected", { message: "Socket connected ✅" })

  /* ================= JOIN ROOM ================= */
  socket.on("joinRoom", async ({ room, username }) => {
    try {
      if (!room) return

      socket.join(room)

      console.log(`📡 Joined room: ${room} (${username})`)

      /* 🟢 TRACK USERS */
      if (!roomUsers[room]) roomUsers[room] = []

      roomUsers[room] = roomUsers[room].filter(
        (u) => u.socketId !== socket.id
      )

      roomUsers[room].push({
        socketId: socket.id,
        username: username || "Anon"
      })

      /* 🔥 BROADCAST USERS LIST */
      io.to(room).emit("roomUsers", roomUsers[room])

      /* ================= LOAD MESSAGES ================= */
      const messages = await Message.find({ room }).sort({ createdAt: 1 })

      console.log(`📦 Loaded ${messages.length} messages`)

      socket.emit("loadMessages", messages)

    } catch (err) {
      console.error("❌ JOIN ROOM ERROR:", err)
      socket.emit("error", "Failed to join room")
    }
  })

  /* ================= SEND MESSAGE ================= */
  socket.on("sendMessage", async (data) => {
    try {
      if (!data?.room || !data?.text) {
        console.warn("⚠️ Invalid message payload")
        return
      }

      const newMessage = await Message.create({
        room: data.room,
        username: data.username || "Anon",
        text: data.text,
        role: data.role || "guest",
        type: data.type || "general",
        category: data.category || "general"
      })

      io.to(data.room).emit("newMessage", newMessage)

    } catch (err) {
      console.error("❌ SAVE MESSAGE ERROR:", err)
    }
  })

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id)

    for (const room in roomUsers) {
      roomUsers[room] = roomUsers[room].filter(
        (u) => u.socketId !== socket.id
      )

      io.to(room).emit("roomUsers", roomUsers[room])
    }
  })
})

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({ message: "Venex API running 🚀" })
})

/* ================= TEST SAVE ================= */
app.get("/test-save", async (req, res) => {
  try {
    const msg = await Message.create({
      room: "test-room",
      username: "system",
      text: "Hello from API",
      role: "vendor",
      type: "product",
      category: "apparel"
    })

    res.json(msg)
  } catch (err) {
    console.error("❌ TEST SAVE ERROR:", err)
    res.status(500).json(err)
  }
})

/* ================= DB + START ================= */
const PORT = process.env.PORT || 5051

/* ================= START SERVER FIRST ================= */
server.listen(PORT, () => {
  console.log(`🚀 Venex backend running on ${PORT}`)
})

/* ================= CONNECT MONGO ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected")
  })
  .catch(err => {
    console.error("❌ Mongo error:", err.message)
  })
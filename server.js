import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import Message from "./models/Message.js"

dotenv.config()

console.log("🌐 MONGO_URI LOADED:", !!process.env.MONGO_URI)
console.log("🌐 CLIENT_URL RAW:", process.env.CLIENT_URL)

/* ================= CLEAN CLIENT URL ================= */
const CLIENT_URL = process.env.CLIENT_URL?.replace("CLIENT_URL=", "") || ""

console.log("🌐 CLIENT_URL CLEAN:", CLIENT_URL)

const app = express()

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:5173",
  CLIENT_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn("❌ CORS BLOCKED:", origin)
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true
}))

app.use(express.json())

/* ================= SERVER ================= */
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

/* ================= LIVE USERS STORE ================= */
const roomUsers = {}

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id)

  socket.emit("connected", { message: "Socket connected ✅" })

  socket.on("joinRoom", async ({ room, username }) => {
    try {
      if (!room) return

      socket.join(room)

      console.log(`📡 Joined room: ${room} (${username})`)

      if (!roomUsers[room]) roomUsers[room] = []

      roomUsers[room] = roomUsers[room].filter(
        (u) => u.socketId !== socket.id
      )

      roomUsers[room].push({
        socketId: socket.id,
        username: username || "Anon"
      })

      io.to(room).emit("roomUsers", roomUsers[room])

      const messages = await Message.find({ room }).sort({ createdAt: 1 })

      socket.emit("loadMessages", messages)

    } catch (err) {
      console.error("❌ JOIN ROOM ERROR:", err)
    }
  })

  socket.on("sendMessage", async (data) => {
    try {
      console.log("📩 MESSAGE RECEIVED:", data)

      if (!data?.room || !data?.text) return

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

/* ================= START ================= */
const PORT = process.env.PORT || 5051

server.listen(PORT, () => {
  console.log(`🚀 Venex backend running on ${PORT}`)
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err.message))
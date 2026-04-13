import express from "express"
import http from "http"
import { Server } from "socket.io"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import Message from "./models/Message.js"

dotenv.config()

const app = express()

app.use(cors({
  origin: "*"
}))

app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

/* ================= MEMORY STORE ================= */
const rooms = {} // { roomId: [messages] }

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id)

  socket.on("joinRoom", async (room) => {

    socket.join(room)

    console.log(`📡 Joined room: ${room}`)

    // 🔥 Load messages from DB
    const messages = await Message.find({ room }).sort({ createdAt: 1 })

    socket.emit("loadMessages", messages)
  })

  socket.on("sendMessage", async (data) => {

    // 🔥 Save to DB
    const newMessage = await Message.create({
      room: data.room,
      username: data.username,
      text: data.text
    })

    io.to(data.room).emit("newMessage", newMessage)
  })

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id)
  })

})

/* ================= ROUTES ================= */
app.get("/", (req, res) => {
  res.json({ message: "Venex API running 🚀" })
})

mongoose.connect("mongodb://127.0.0.1:27017/venex")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err))

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5051

server.listen(PORT, () => {
  console.log(`🚀 Venex backend running on ${PORT}`)
})

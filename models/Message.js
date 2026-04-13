import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  room: String,

  username: String,

  text: String,

  /* 🔥 NEW STRUCTURE */
  role: {
    type: String,
    enum: ["vendor", "customer", "guest"],
    default: "guest"
  },

  type: {
    type: String,
    enum: ["product", "service", "event", "request", "general"],
    default: "general"
  },

  category: {
    type: String,
    default: "general"
  }

}, { timestamps: true })

export default mongoose.model("Message", messageSchema)
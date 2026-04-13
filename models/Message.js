import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  room: String,
  username: String,
  text: String,

  role: {
    type: String,
    enum: ["vendor", "customer", "coordinator", "guest"],
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
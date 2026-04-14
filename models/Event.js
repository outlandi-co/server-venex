import mongoose from "mongoose"

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  roomId: String,
  createdBy: String
}, {
  timestamps: true
})

export default mongoose.model("Event", eventSchema)
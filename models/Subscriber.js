import mongoose from "mongoose"

const subscriberSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  eventId: String
}, { timestamps: true })

export default mongoose.model("Subscriber", subscriberSchema)
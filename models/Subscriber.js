import mongoose from "mongoose"

const subscriberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true
    },
    lastName: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true
    },
    eventId: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
)

export default mongoose.model("Subscriber", subscriberSchema)
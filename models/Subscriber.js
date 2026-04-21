import mongoose from "mongoose"

const subscriberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: ""
    },
    lastName: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    eventId: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
)

export default mongoose.model("Subscriber", subscriberSchema)
import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: String,
  role: {
    type: String,
    enum: ["admin", "vendor", "coordinator"],
    default: "vendor"
  },

  /* 🔥 NEW FIELD */
  approved: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

export default mongoose.model("User", userSchema)
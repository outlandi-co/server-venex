import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,

  role: {
    type: String,
    enum: ["vendor", "customer", "coordinator"],
    default: "customer"
  }

}, { timestamps: true })

export default mongoose.model("User", userSchema)
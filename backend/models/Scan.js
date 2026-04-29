import mongoose from "mongoose";

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: false },
  food: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Scan", scanSchema);

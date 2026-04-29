import mongoose from "mongoose";

const scanSchema = new mongoose.Schema({
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
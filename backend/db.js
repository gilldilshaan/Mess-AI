import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/messai");
    console.log("✅ MongoDB Connected (Local)");
  } catch (err) {
    console.error("❌ Mongo Error:", err);
  }
};
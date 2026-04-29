import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    city: { type: String, default: "" },
    dailyWaterLiters: { type: Number, default: null },
    currentTemperature: { type: Number, default: null },
    profile: {
      age: { type: Number, default: null },
      gender: { type: String, default: null },
      height: { type: Number, default: null },
      weight: { type: Number, default: null },
      activity: { type: String, default: null },
      goal: { type: String, default: "maintain" },
      allergies: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

export default mongoose.model("User", userSchema);

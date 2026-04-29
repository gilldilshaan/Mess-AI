import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";

import { getAIRecommendation } from "./ai.js";
import { detectFood } from "./detector.js";
import { getNutritionFromSpoonacular } from "./spoonacular.js";
import { getNutrition } from "./openfoodfacts.js";
import { generateAdvice } from "./advice.js";

import Scan from "./models/Scan.js";

// ✅ FIXED IMPORT (IMPORTANT)
import { user, calculateTDEE, filterFood } from "./userService.js";

const app = express();

app.use(cors());
app.use(express.json());

// 🚀 MULTER
const upload = multer({
  limits: { fileSize: 8 * 1024 * 1024 }
});

// 🔥 CONNECT MONGODB
mongoose.connect("mongodb://127.0.0.1:27017/messai")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// ✅ HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ ok: true });
});


// 🚀 SET USER PROFILE
app.post('/set-user', (req, res) => {
  try {
    const { age, gender, height, weight, activity, goal, allergies } = req.body;

    if (!age || !gender || !height || !weight || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    user.age = Number(age);
    user.gender = gender;
    user.height = Number(height);
    user.weight = Number(weight);
    user.activity = activity;
    user.goal = goal || "maintain";
    user.allergies = allergies || [];

    return res.json({
      message: "User data saved successfully",
      tdee: calculateTDEE(user)
    });

  } catch (err) {
    console.error("SET USER ERROR:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
});


// 🚀 TRACKER (WITH AI)
app.get("/tracker", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = await Scan.find({
      createdAt: { $gte: today }
    });

    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0
    };

    data.forEach(item => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
    });

    const ai = getAIRecommendation(totals);

    res.json({
      items: data,
      totals,
      ai
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tracker failed" });
  }
});


// 🚀 MANUAL TRACK ENTRY
app.post("/track", async (req, res) => {
  try {
    const { food, calories, protein, carbs } = req.body;

    if (!food || calories == null) {
      return res.status(400).json({ error: "Missing food or calories" });
    }

    const entry = await Scan.create({
      food,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0
    });

    res.json({ success: true, entry });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Track failed" });
  }
});


// 🔥 MAIN SCAN ROUTE
app.post("/scan-food", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    const top = detectFood(req, 3);
    const food = top[0].label;

    let nutrition;

    try {
      nutrition = await getNutritionFromSpoonacular(food);
    } catch (err) {
      console.log("Spoonacular failed → fallback");
      nutrition = await getNutrition(food);
    }

    const advice = generateAdvice({
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs
    });

    // 💾 SAVE
    await Scan.create({
      food,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fats: nutrition.fats || 0
    });

    // ✅ PERSONALIZATION
    const foodList = [
      {
        name: food,
        calories: nutrition.calories,
        ingredients: food
      }
    ];

    const filteredFood = filterFood(foodList);

    res.json({
      food,
      filteredFood,
      alternatives: top,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      message: advice.message,
      recommendation: advice.recommendation,
      healthRating: advice.healthRating,
      source: nutrition.source
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Scan failed",
      details: err.message
    });
  }
});


// 🚀 START SERVER
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
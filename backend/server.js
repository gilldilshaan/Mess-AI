import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";

import { detectFood } from "./detector.js";
import { getNutritionFromSpoonacular } from "./spoonacular.js";
import { getNutrition } from "./openfoodfacts.js";
import { generateAdvice } from "./advice.js";

const app = express();

const upload = multer({
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

// ✅ HEALTH
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ TRACKER
const dailyLog = [];

app.get("/tracker", (req, res) => {
  const today = new Date().toDateString();

  const todayItems = dailyLog.filter(
    (item) => new Date(item.timestamp).toDateString() === today
  );

  const totals = todayItems.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0 }
  );

  res.json({ items: todayItems, totals });
});

// ✅ ADD ENTRY
app.post("/track", (req, res) => {
  const { food, calories, protein, carbs } = req.body;

  if (!food || calories == null) {
    return res.status(400).json({ error: "Missing food or calories" });
  }

  const entry = {
    id: Date.now(),
    food,
    calories: Number(calories),
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    timestamp: new Date().toISOString()
  };

  dailyLog.push(entry);
  res.json({ success: true, entry });
});

// 🔥 MAIN SCAN ROUTE
app.post("/scan-food", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    // ✅ DETECTION (FIXED)
    const top = detectFood(req, 3);
    const food = top[0].label;

    console.log("Detected:", top);
    console.log("Final Food:", food);

    let nutrition;

    try {
      // 🥇 Spoonacular
      nutrition = await getNutritionFromSpoonacular(food);
    } catch (err) {
      console.log("Spoonacular failed → fallback");
      // 🥈 OpenFoodFacts
      nutrition = await getNutrition(food);
    }

    const advice = generateAdvice({
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs
    });

    // ✅ FINAL RESPONSE (FIXED)
    res.json({
      food: food,            // ✅ STRING
      alternatives: top,     // ✅ ARRAY
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

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
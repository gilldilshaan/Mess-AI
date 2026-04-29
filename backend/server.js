import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { getAIRecommendation } from "./ai.js";
import { detectFood } from "./detector.js";
import { getNutritionFromSpoonacular } from "./spoonacular.js";
import { getNutrition } from "./openfoodfacts.js";
import { lookupNutrition } from "./nutrition.js";
import { generateAdvice, generateMealRecommendation } from "./advice.js";

import Scan from "./models/Scan.js";
import User from "./models/User.js";

import {
  calculateDailyWaterLiters,
  calculateTDEE,
  fetchCurrentTemperatureC,
  filterFood,
  matchAllergies
} from "./userService.js";

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

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

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: normalizedEmail }).lean();
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ email: normalizedEmail, passwordHash });

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    return res.status(500).json({ error: "Register failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toJSON() });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/auth/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.json({ user: user.toJSON() });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/get-user", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });
    const u = user.toJSON();
    return res.json({ user: { ...u, ...(u.profile || {}) }, tdee: calculateTDEE(user.profile) });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

// 🚀 SET USER PROFILE
app.post("/set-user", authRequired, async (req, res) => {
  try {
    const { age, gender, height, weight, activity, goal, allergies, city } = req.body;

    if (age == null || !gender || height == null || weight == null || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const profile = {
      age: Number(age),
      gender: String(gender),
      height: Number(height),
      weight: Number(weight),
      activity: String(activity),
      goal: goal || "maintain",
      allergies: Array.isArray(allergies) ? allergies : []
    };

    const currentTemperature = await fetchCurrentTemperatureC(city);
    const dailyWaterLiters = calculateDailyWaterLiters(profile.weight, currentTemperature);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { profile, city: String(city || ""), currentTemperature, dailyWaterLiters } },
      { returnDocument: "after" }
    );
    if (!user) return res.status(404).json({ error: "Not found" });

    return res.json({
      message: "User data saved successfully",
      tdee: calculateTDEE(user.profile),
      currentTemperature,
      dailyWaterLiters,
      user: user.toJSON()
    });

  } catch (err) {
    console.error("SET USER ERROR:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.post("/api/recommend-meal", authRequired, async (req, res) => {
  try {
    const { userId, email } = req.body || {};

    if (userId && String(userId) !== String(req.userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const query = userId
      ? { _id: userId }
      : email
        ? { email: String(email).trim().toLowerCase() }
        : { _id: req.userId };

    const user = await User.findOne(query).lean();
    if (!user) return res.status(404).json({ error: "Not found" });

    const dailyCalorieTarget = calculateTDEE(user.profile) || null;
    if (!dailyCalorieTarget) {
      return res.status(400).json({ error: "Profile incomplete for TDEE" });
    }

    const goal = String(user.profile?.goal || "maintain").toLowerCase();
    const allergies = Array.isArray(user.profile?.allergies) ? user.profile.allergies : [];
    const dailyWaterLiters = user.dailyWaterLiters ?? null;

    let adjustedDailyCalories = dailyCalorieTarget;
    if (goal === "loss" || goal === "lose") adjustedDailyCalories -= 500;
    else if (goal === "gain") adjustedDailyCalories += 500;

    const targetMealCalories = Math.max(0, Math.round(adjustedDailyCalories / 3));

    const templates = [
      ["dal", "roti", "sambar"],
      ["rajma", "white rice", "sambar"],
      ["poha", "omelette"],
      ["idli", "sambar"],
      ["upma", "curd"],
      ["dosa", "sambar"],
      ["chicken curry", "roti"],
      ["paneer butter masala", "roti"]
    ];

    const normalizedAllergies = allergies.map((a) => String(a).toLowerCase()).filter(Boolean);
    const containsAllergy = (name) => {
      const n = String(name || "").toLowerCase();
      return normalizedAllergies.some((a) => n.includes(a));
    };

    const buildMeal = (names) => {
      const items = names
        .filter((n) => !containsAllergy(n))
        .map((n) => {
          const nu = lookupNutrition(n);
          if (!nu) return null;
          return {
            name: n,
            calories: Number(nu.calories) || 0,
            protein: Number(nu.protein) || 0,
            carbs: Number(nu.carbs) || 0
          };
        })
        .filter(Boolean);

      return items;
    };

    let base = buildMeal(templates[Math.floor(Math.random() * templates.length)]);
    if (!base.length) {
      const fallback = ["dal", "roti", "sambar", "idli", "upma", "white rice", "rajma"];
      base = buildMeal(fallback);
    }

    const baseCalories = base.reduce((s, it) => s + (it.calories || 0), 0);
    if (!baseCalories || targetMealCalories <= 0) {
      return res.json({
        foods: [],
        targetMealCalories,
        dailyWaterLiters
      });
    }

    const factor = targetMealCalories / baseCalories;
    const scaled = base.map((it) => ({
      name: it.name,
      calories: Math.max(0, Math.round(it.calories * factor)),
      protein: Math.max(0, Math.round(it.protein * factor)),
      carbs: Math.max(0, Math.round(it.carbs * factor))
    }));

    const sumScaled = scaled.reduce((s, it) => s + it.calories, 0);
    const delta = targetMealCalories - sumScaled;
    if (scaled.length) scaled[scaled.length - 1].calories = Math.max(0, scaled[scaled.length - 1].calories + delta);

    return res.json({
      foods: scaled,
      targetMealCalories,
      dailyWaterLiters
    });
  } catch {
    return res.status(500).json({ error: "Recommend meal failed" });
  }
});

app.get("/dashboard", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await Scan.find({
      createdAt: { $gte: today },
      userId: req.userId
    });

    const totals = items.reduce(
      (acc, it) => {
        acc.calories += it.calories || 0;
        acc.protein += it.protein || 0;
        acc.carbs += it.carbs || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0 }
    );

    const ai = getAIRecommendation(totals);

    return res.json({
      user: { ...user.toJSON(), ...(user.toJSON().profile || {}) },
      items,
      totals,
      ai
    });
  } catch {
    return res.status(500).json({ error: "Dashboard failed" });
  }
});


// 🚀 TRACKER (WITH AI)
app.get("/tracker", authRequired, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = await Scan.find({
      createdAt: { $gte: today },
      userId: req.userId
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
app.post("/track", authRequired, async (req, res) => {
  try {
    const { food, calories, protein, carbs } = req.body;

    if (!food || calories == null) {
      return res.status(400).json({ error: "Missing food or calories" });
    }

    const entry = await Scan.create({
      userId: req.userId,
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
app.post("/scan-food", authRequired, upload.single("image"), async (req, res) => {
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

    const { synergyBooster } = await generateMealRecommendation();

    const user = await User.findById(req.userId).lean();
    const profile = user?.profile || null;
    const allergyMatches = matchAllergies(food, profile?.allergies || []);

    // 💾 SAVE
    await Scan.create({
      userId: req.userId,
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

    const filteredFood = filterFood(foodList, profile);

    res.json({
      food,
      filteredFood,
      allergyMatches,
      alternatives: top,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      message: advice.message,
      recommendation: advice.recommendation,
      healthRating: advice.healthRating,
      synergyBooster,
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

app.get("/history", authRequired, async (req, res) => {
  try {
    const items = await Scan.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(500);
    const totals = items.reduce(
      (acc, it) => {
        acc.calories += it.calories || 0;
        acc.protein += it.protein || 0;
        acc.carbs += it.carbs || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0 }
    );
    return res.json({ items, totals });
  } catch {
    return res.status(500).json({ error: "History failed" });
  }
});

// 🚀 START SERVER
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

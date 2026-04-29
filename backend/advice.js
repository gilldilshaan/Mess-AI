import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h <= 11) return "morning";
  if (h >= 12 && h <= 16) return "afternoon";
  return "evening";
}

async function loadAncientWisdom() {
  try {
    const url = new URL("./data/ancient_wisdom.json", import.meta.url);
    const raw = await readFile(url, "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

async function pickSynergyBooster() {
  const timeOfDay = getTimeOfDay();
  const items = await loadAncientWisdom();
  const suitable = items.filter((b) => b && b.timeOfDay === timeOfDay);
  if (!suitable.length) return null;
  const b = suitable[Math.floor(Math.random() * suitable.length)];
  if (!b) return null;
  return {
    name: String(b.name || ""),
    ancientUse: String(b.ancientUse || ""),
    modernScience: String(b.modernScience || "")
  };
}

export async function generateMealRecommendation() {
  const meals = [
    { meal: "Quinoa and Lentil Bowl", macros: { protein: "20g", carbs: "45g", fats: "12g" } },
    { meal: "Moong Dal Khichdi + Curd", macros: { protein: "18g", carbs: "55g", fats: "10g" } },
    { meal: "Paneer Bhurji + Roti + Salad", macros: { protein: "26g", carbs: "40g", fats: "14g" } },
    { meal: "Chole + Brown Rice + Kachumber", macros: { protein: "19g", carbs: "60g", fats: "11g" } }
  ];

  const base = meals[Math.floor(Math.random() * meals.length)];
  const synergyBooster = await pickSynergyBooster();
  return { ...base, synergyBooster };
}

export function generateAdvice({ calories, protein, carbs }) {
  if (
    calories == null ||
    protein == null ||
    carbs == null
  ) {
    return {
      message: "Couldn’t confidently estimate nutrition from this meal.",
      recommendation: "Try a clearer photo (top view, good light) or scan again.",
      healthRating: null
    };
  }

  const highCalories = calories >= 650;
  const highCarbs = carbs >= 85;
  const lowProtein = protein <= 12;

  let message = "Balanced meal overall.";
  let recommendation = "Keep hydration + add veggies if possible.";

  if (lowProtein && highCarbs) {
    message = "High carb, low protein meal.";
    recommendation = "Add protein (dal/curd/egg/chicken/paneer) to balance it.";
  } else if (lowProtein) {
    message = "Low protein meal.";
    recommendation = "Add a protein side (dal/curd/egg/paneer).";
  } else if (highCalories) {
    message = "High calorie meal.";
    recommendation = "Keep next meal lighter; avoid extra oil/sweets.";
  } else if (highCarbs) {
    message = "Carb-heavy meal.";
    recommendation = "Reduce rice/bread and add veggies + protein.";
  } else if (protein >= 20) {
    message = "Good protein for a mess meal.";
    recommendation = "Nice—pair with veggies/fruit for better balance.";
  }

  let rating = 8;
  if (highCalories) rating -= 2;
  if (highCarbs) rating -= 2;
  if (lowProtein) rating -= 2;
  rating = clamp(rating, 1, 10);

  return { message, recommendation, healthRating: rating };
}

const isDirectRun =
  Boolean(process.argv?.[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  const out = await generateMealRecommendation();
  console.log(JSON.stringify(out, null, 2));
}

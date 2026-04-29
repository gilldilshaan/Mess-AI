const activityMap = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const ALLERGY_SYNONYMS = {
  dairy: ["milk", "butter", "ghee", "cheese", "paneer", "cream", "curd", "yogurt", "lassi", "whey", "casein", "lactose"],
  peanut: ["peanut", "groundnut", "mungfali"],
  nuts: ["nut", "almond", "cashew", "pistachio", "walnut", "hazelnut"],
  egg: ["egg", "omelette", "omelet"],
  soy: ["soy", "soya", "tofu", "soybean"],
  gluten: ["gluten", "wheat", "maida", "bread", "pasta"],
  fish: ["fish", "salmon", "tuna"],
  shellfish: ["shrimp", "prawn", "crab", "lobster"]
};

function normalizeText(s) {
  return String(s || "").toLowerCase();
}

function getAllergyKeywords(allergy) {
  const a = normalizeText(allergy).trim();
  if (!a) return [];
  const synonyms = ALLERGY_SYNONYMS[a] || [];
  return Array.from(new Set([a, ...synonyms].map((x) => normalizeText(x).trim()).filter(Boolean)));
}

export function matchAllergies(text, allergies) {
  const hay = normalizeText(text);
  const list = Array.isArray(allergies) ? allergies : [];
  const triggered = [];

  for (const raw of list) {
    const a = normalizeText(raw).trim();
    if (!a) continue;
    const keywords = getAllergyKeywords(a);
    if (keywords.some((k) => hay.includes(k))) triggered.push(a);
  }

  return Array.from(new Set(triggered));
}

export async function fetchCurrentTemperatureC(city) {
  const safeCity = String(city || "").trim();
  if (!safeCity) return 25;
  const url = `https://wttr.in/${encodeURIComponent(safeCity)}?format=j1`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "messai/1.0" } });
    if (!res.ok) return 25;
    const json = await res.json();
    const tempC = Number(json?.current_condition?.[0]?.temp_C);
    return Number.isFinite(tempC) ? tempC : 25;
  } catch {
    return 25;
  }
}

export function calculateDailyWaterLiters(weightKg, temperatureC) {
  const w = Number(weightKg);
  const t = Number(temperatureC);

  const baseline = Number.isFinite(w) && w > 0 ? w * 0.033 : 2.5;
  let extra = 0;
  if (Number.isFinite(t) && t >= 35) extra = 1.0;
  else if (Number.isFinite(t) && t >= 30) extra = 0.5;

  const liters = baseline + extra;
  return Math.round(liters * 10) / 10;
}

export function calculateTDEE(profile) {
  if (!profile?.age || !profile?.gender || !profile?.height || !profile?.weight) {
    return null;
  }

  const goal = String(profile.goal || "maintain").toLowerCase();

  let bmr;

  if (String(profile.gender).toLowerCase() === "male") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const activityMultiplier = activityMap[profile.activity] || 1.2;

  let tdee = bmr * activityMultiplier;

  if (goal === "loss" || goal === "lose") {
    tdee -= 500;
  } else if (goal === "gain") {
    tdee += 500;
  }

  return Math.round(tdee);
}

export function filterFood(foodList, profile) {
  if (!profile?.age || !profile?.weight) {
    return foodList;
  }

  const tdee = calculateTDEE(profile);
  if (!tdee) return foodList;
  const perMealCalories = tdee / 3;

  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];

  return foodList.filter(food => {
    const ingredients = food.ingredients?.toLowerCase() || "";

    const hasAllergy = matchAllergies(ingredients, allergies).length > 0;

    if (hasAllergy) return false;

    // ❌ Calorie check
    if (food.calories > perMealCalories) return false;

    return true;
  });
}

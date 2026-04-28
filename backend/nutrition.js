const FOOD_NUTRITION = {
  "butter naan": { calories: 320, protein: 8, carbs: 52 },
  "chicken curry": { calories: 420, protein: 28, carbs: 12 },
  dal: { calories: 220, protein: 14, carbs: 28 },
  dosa: { calories: 280, protein: 7, carbs: 45 },
  "fried rice": { calories: 520, protein: 12, carbs: 85 },
  idli: { calories: 180, protein: 6, carbs: 36 },
  omelette: { calories: 180, protein: 12, carbs: 1 },
  "paneer butter masala": { calories: 520, protein: 18, carbs: 22 },
  poha: { calories: 260, protein: 6, carbs: 45 },
  rajma: { calories: 280, protein: 15, carbs: 40 },
  "rajma rice": { calories: 560, protein: 18, carbs: 90 },
  roti: { calories: 120, protein: 4, carbs: 22 },
  sambar: { calories: 180, protein: 9, carbs: 22 },
  upma: { calories: 280, protein: 7, carbs: 48 },
  vada: { calories: 300, protein: 6, carbs: 35 },
  "white rice": { calories: 260, protein: 5, carbs: 57 }
};

function normalizeFoodName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function lookupNutrition(foodName) {
  const key = normalizeFoodName(foodName);
  if (!key) return null;
  if (FOOD_NUTRITION[key]) return { ...FOOD_NUTRITION[key] };

  const aliases = { chapati: "roti", naan: "butter naan", rice: "white rice" };
  const a = aliases[key];
  if (a && FOOD_NUTRITION[a]) return { ...FOOD_NUTRITION[a] };

  return null;
}
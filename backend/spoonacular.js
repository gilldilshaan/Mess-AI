export async function getNutritionFromSpoonacular(food) {
  const key = process.env.SPOONACULAR_API_KEY;

  const url = `https://api.spoonacular.com/recipes/guessNutrition?title=${food}&apiKey=${key}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.calories) {
    throw new Error("Spoonacular failed");
  }

  return {
    calories: data.calories.value,
    protein: data.protein.value,
    carbs: data.carbs.value,
    source: "spoonacular"
  };
}
// backend/openfoodfacts.js

export async function getNutrition(foodName) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${foodName}&search_simple=1&json=1`;

  const res = await fetch(url);
  const data = await res.json();

  const product = data.products?.[0];

  if (!product) {
    return {
      calories: 250,
      protein: 8,
      carbs: 30,
      source: "fallback"
    };
  }

  const nutriments = product.nutriments || {};

  return {
    calories: nutriments["energy-kcal"] || 250,
    protein: nutriments["proteins"] || 8,
    carbs: nutriments["carbohydrates"] || 30,
    source: "openfoodfacts"
  };
}
export function getAIRecommendation(totals) {
  const { protein } = totals;

  const target = 100;
  const remaining = target - protein;

  if (remaining <= 0) {
    return {
      message: "🎉 Protein goal achieved!",
      suggestion: "Maintain balance with veggies and hydration."
    };
  }

  let foods = [];

  if (remaining > 50) {
    foods = ["chicken", "paneer", "eggs", "protein shake"];
  } else if (remaining > 25) {
    foods = ["eggs", "dal", "curd", "paneer"];
  } else {
    foods = ["milk", "curd", "nuts"];
  }

  return {
    message: `⚠️ You need ${remaining}g more protein today.`,
    suggestion: `👉 Add: ${foods.join(", ")}`
  };
}
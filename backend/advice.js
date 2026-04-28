function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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
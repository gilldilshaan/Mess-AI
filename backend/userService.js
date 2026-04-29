const activityMap = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
};

export function calculateTDEE(profile) {
  if (!profile?.age || !profile?.gender || !profile?.height || !profile?.weight) {
    return null;
  }

  let bmr;

  if (String(profile.gender).toLowerCase() === "male") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const activityMultiplier = activityMap[profile.activity] || 1.2;

  let tdee = bmr * activityMultiplier;

  if (profile.goal === "loss") {
    tdee -= 500;
  } else if (profile.goal === "gain") {
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

  const allergies = (profile.allergies || []).map(a => String(a).toLowerCase());

  return foodList.filter(food => {
    const ingredients = food.ingredients?.toLowerCase() || "";

    // ❌ Allergy check
    const hasAllergy = allergies.some(allergy =>
      ingredients.includes(allergy)
    );

    if (hasAllergy) return false;

    // ❌ Calorie check
    if (food.calories > perMealCalories) return false;

    return true;
  });
}

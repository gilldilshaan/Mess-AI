// backend/userService.js

// 🧠 In-memory user storage
const user = {
  age: null,
  gender: null,
  height: null,
  weight: null,
  activity: null,
  goal: "maintain",
  allergies: []
};

// 🔢 Activity multipliers
const activityMap = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
};

// 🧠 Calculate TDEE
function calculateTDEE(user) {
  if (!user.age || !user.gender || !user.height || !user.weight) {
    return null;
  }

  let bmr;

  if (user.gender.toLowerCase() === "male") {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  } else {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
  }

  const activityMultiplier = activityMap[user.activity] || 1.2;

  let tdee = bmr * activityMultiplier;

  // 🎯 Goal adjustment
  if (user.goal === "loss") {
    tdee -= 500;
  } else if (user.goal === "gain") {
    tdee += 500;
  }

  return Math.round(tdee);
}

// 🍽️ Filter food based on user
function filterFood(foodList) {
  // If user not set → return original
  if (!user.age || !user.weight) {
    return foodList;
  }

  const tdee = calculateTDEE(user);
  const perMealCalories = tdee / 3;

  const allergies = user.allergies.map(a => a.toLowerCase());

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

module.exports = {
  user,
  calculateTDEE,
  filterFood
};
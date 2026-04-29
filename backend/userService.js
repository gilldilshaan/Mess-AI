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

export async function fetchCurrentTemperatureC(city) {
  if (!city || !String(city).trim()) return 25;

  const safeCity = encodeURIComponent(String(city).trim());
  const primaryUrl = `https://wttr.in/${safeCity}?format=j1.`;
  const fallbackUrl = `https://wttr.in/${safeCity}?format=j1`;

  const readTemp = async url => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();
    const temp = Number(data?.current_condition?.[0]?.temp_C);
    if (!Number.isFinite(temp)) throw new Error("Invalid temperature");
    return temp;
  };

  try {
    return await readTemp(primaryUrl);
  } catch {
    try {
      return await readTemp(fallbackUrl);
    } catch {
      return 25;
    }
  }
}

export function calculateDailyWaterLiters(weightKg, temperatureC) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return null;

  const temp = Number(temperatureC);
  let goal = weight * 0.033;

  if (Number.isFinite(temp)) {
    if (temp >= 35) goal += 1.0;
    else if (temp >= 30) goal += 0.5;
  }

  return Math.round(goal * 100) / 100;
}

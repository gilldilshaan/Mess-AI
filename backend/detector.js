// backend/detector.js

// ✅ SYNONYMS
const SYNONYMS = {
  chicken: ["murgh"],
  paneer: ["cottage cheese"],
  roti: ["chapati"]
};


// 🍽️ FOOD DATABASE (IMPROVED)
const FOOD_DB = [{
  name: "fish",
  keywords: [
    "fish",
    "fish fry",
    "fried fish",
    "grilled fish",
    "fish curry",
    "fish masala",
    "tandoori fish",
    "machhi",
    "machhli"
  ],
  related: ["seafood", "nonveg", "protein"],
  priority: "high"
},

  // 🍗 NON-VEG (HIGH PRIORITY)
  {
    name: "chicken",
    keywords: ["chicken", "fried chicken", "grilled chicken", "tandoori chicken", "kfc"],
    related: ["meat", "nonveg"],
    priority: "high"
  },
  {
    name: "butter chicken",
    keywords: ["butter chicken", "murgh makhani"],
    related: ["naan", "gravy"],
    priority: "high"
  },
  {
    name: "chicken curry",
    keywords: ["chicken curry", "desi chicken"],
    related: ["rice", "roti"],
    priority: "high"
  },
  {
    name: "chicken biryani",
    keywords: ["chicken biryani"],
    related: ["rice", "spicy"],
    priority: "high"
  },
  {
    name: "mutton curry",
    keywords: ["mutton curry", "goat curry"],
    related: ["roti", "rice"],
    priority: "high"
  },
  {
    name: "fish curry",
    keywords: ["fish curry", "fried fish"],
    related: ["rice"],
    priority: "high"
  },
  {
    name: "egg",
    keywords: ["egg", "omelette", "boiled egg"],
    related: ["protein"],
    priority: "high"
  },

  // 🍛 INDIAN MAIN
  {
    name: "rajma",
    keywords: ["rajma", "kidney beans"],
    related: ["rice"]
  },
  {
    name: "chole",
    keywords: ["chole", "chickpea", "chana"],
    related: ["bhature"]
  },
  {
    name: "dal",
    keywords: ["dal", "daal", "lentil"],
    related: ["rice"]
  },
  {
    name: "kadhi",
    keywords: ["kadhi"],
    related: ["rice"]
  },
  {
    name: "paneer butter masala",
    keywords: ["paneer butter masala"],
    related: ["naan"],
    priority: "high"
  },
  {
    name: "palak paneer",
    keywords: ["palak paneer"],
    related: ["roti"],
    priority: "high"
  },
  {
    name: "mix veg",
    keywords: ["mix veg", "vegetable curry"],
    related: ["roti"]
  },
  {
    name: "aloo sabzi",
    keywords: ["aloo sabzi", "potato curry"],
    related: ["roti"]
  },

  // 🍚 RICE
  {
    name: "plain rice",
    keywords: ["rice", "steamed rice"],
    related: ["dal", "rajma"]
  },
  {
    name: "jeera rice",
    keywords: ["jeera rice"],
    related: ["dal"]
  },
  {
    name: "pulao",
    keywords: ["pulao", "veg pulao"],
    related: ["rice"]
  },
  {
    name: "fried rice",
    keywords: ["fried rice"],
    related: ["noodles"]
  },

  // 🍞 BREAD
  {
    name: "roti",
    keywords: ["roti", "chapati"],
    related: ["sabzi"]
  },
  {
    name: "naan",
    keywords: ["naan"],
    related: ["paneer"]
  },
  {
    name: "paratha",
    keywords: ["paratha", "aloo paratha"],
    related: ["butter", "curd"]
  },
  {
    name: "bhature",
    keywords: ["bhature"],
    related: ["chole"]
  },

  // 🍔 FAST FOOD
  {
    name: "burger",
    keywords: ["burger", "cheeseburger"],
    related: ["fries"]
  },
  {
    name: "pizza",
    keywords: ["pizza"],
    related: ["cheese"]
  },
  {
    name: "noodles",
    keywords: ["noodles", "hakka noodles"],
    related: ["sauce"]
  },
  {
    name: "pasta",
    keywords: ["pasta"],
    related: ["cheese"]
  },

  // 🍰 DESSERT
  {
    name: "gulab jamun",
    keywords: ["gulab jamun"],
    related: ["sweet"]
  },
  {
    name: "ice cream",
    keywords: ["ice cream"],
    related: ["dessert"]
  },

  // ☕ DRINKS
  {
    name: "tea",
    keywords: ["tea", "chai"],
    related: []
  },
  {
    name: "coffee",
    keywords: ["coffee"],
    related: []
  },
  
// 🐟 SEAFOOD (EXPANDED)
{
  name: "prawns",
  keywords: [
    "prawn", "prawns", "shrimp", "shrimp fry",
    "prawn curry", "prawn masala", "tandoori prawn"
  ],
  related: ["seafood", "nonveg", "protein"],
  priority: "high"
},
{
  name: "fish tikka",
  keywords: ["fish tikka", "tandoori fish tikka"],
  related: ["fish"],
  priority: "high"
},
{
  name: "crab",
  keywords: ["crab", "crab curry", "crab masala"],
  related: ["seafood"],
  priority: "high"
},
{
  name: "lobster",
  keywords: ["lobster", "lobster butter", "lobster curry"],
  related: ["seafood"],
  priority: "high"
},

// 🥚 EGGS (DETAILED)
{
  name: "omelette",
  keywords: ["omelette", "omelet", "egg omelette"],
  related: ["egg", "breakfast"],
  priority: "high"
},
{
  name: "boiled egg",
  keywords: ["boiled egg", "egg boiled"],
  related: ["egg"],
  priority: "high"
},
{
  name: "egg bhurji",
  keywords: ["egg bhurji", "anda bhurji"],
  related: ["egg"],
  priority: "high"
},
{
  name: "scrambled eggs",
  keywords: ["scrambled egg", "scrambled eggs"],
  related: ["egg"],
  priority: "high"
},

// ☕ DRINKS (UPGRADED)
{
  name: "black coffee",
  keywords: ["black coffee", "americano"],
  related: ["coffee", "drink"]
},
{
  name: "cold coffee",
  keywords: ["cold coffee", "iced coffee"],
  related: ["coffee", "milk"]
},
{
  name: "matcha",
  keywords: ["matcha", "matcha latte", "green tea matcha"],
  related: ["tea", "drink"]
},
{
  name: "green tea",
  keywords: ["green tea"],
  related: ["tea"]
},
{
  name: "protein shake",
  keywords: ["protein shake", "whey shake", "protein drink"],
  related: ["drink", "fitness"]
},
{
  name: "smoothie",
  keywords: ["smoothie", "fruit smoothie"],
  related: ["drink", "fruit"]
},
{
  name: "buttermilk",
  keywords: ["buttermilk", "chaas"],
  related: ["curd", "drink"]
},

// 🍳 BREAKFAST / FITNESS FOODS
{
  name: "boiled eggs and toast",
  keywords: ["eggs and toast", "boiled egg toast"],
  related: ["egg", "bread"]
},
{
  name: "avocado toast",
  keywords: ["avocado toast"],
  related: ["bread", "healthy"]
},
{
  name: "peanut butter",
  keywords: ["peanut butter"],
  related: ["bread", "protein"]
},

// 🍗 EXTRA PROTEIN FOODS
{
  name: "grilled chicken",
  keywords: ["grilled chicken"],
  related: ["chicken"],
  priority: "high"
},
{
  name: "chicken salad",
  keywords: ["chicken salad"],
  related: ["salad"],
  priority: "high"
}
];


// 🔍 SCORING FUNCTION (UPGRADED)
function scoreFood(name, food) {
  let score = 0;

  // 🔹 keyword match
  for (const keyword of food.keywords) {
    if (name.includes(keyword)) {
      score += 5;
    }
  }

  // 🔹 related match
  for (const rel of food.related) {
    if (name.includes(rel)) {
      score += 2;
    }
  }

  // 🔹 synonym boost
  if (SYNONYMS[food.name]) {
    for (const syn of SYNONYMS[food.name]) {
      if (name.includes(syn)) {
        score += 3;
      }
    }
  }

  // 🔹 priority boost
  if (food.priority === "high") {
    score += 2;
  }

  // 🔹 specificity boost (VERY IMPORTANT)
  if (food.name.split(" ").length > 1) {
    score += 2;
  }

  return score;
}


// 🚀 MAIN DETECTOR
export function detectFood(req, topK = 3) {
  let fileName = (req.file?.originalname || "").toLowerCase();

  // ✅ STRONG NORMALIZATION
  fileName = fileName
    .replace(/[_-]/g, " ")      // snake_case → words
    .replace(/[^\w\s]/g, "")   // remove symbols
    .replace(/\s+/g, " ")      // extra spaces
    .trim();

  // 🧠 DEBUG LOGS (VERY IMPORTANT)
  console.log("📁 Original File:", req.file?.originalname);
  console.log("🧼 Normalized File:", fileName);

  const results = FOOD_DB.map(food => {
    const score = scoreFood(fileName, food);

    // 🔍 debug each food score
    if (score > 0) {
      console.log(`✅ Match: ${food.name} → ${score}`);
    }

    return {
      label: food.name,
      score
    };
  });

  // 🔥 chicken boost
  if (fileName.includes("chicken")) {
    results.forEach(r => {
      if (r.label.includes("chicken")) {
        r.score += 10;
      }
    });
  }

  results.sort((a, b) => b.score - a.score);

  // 🧠 DEBUG FINAL OUTPUT
  console.log("🏆 Top Results:", results.slice(0, topK));

  // ✅ stable fallback
  if (results[0].score === 0) {
    console.log("⚠️ No match found → returning unknown");
    return [{ label: "unknown food", score: 0 }];
  }

  return results.slice(0, topK);
}

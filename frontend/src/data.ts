import { FoodAnalysis, UserProfile, UserAccount, AdminStats } from './types';

export const INITIAL_USER: UserProfile = {
  name: 'Gazi Nafisa Maliat',
  email: 'nafisa.maliat912@gmail.com',
  age: 22,
  gender: 'Female',
  height: 165,
  weight: 58,
  healthConditions: ['Mild Sodium Sensitivity'],
  dietaryPreferences: ['High Protein', 'Balanced Carb'],
};

export const FOOD_PRESETS: FoodAnalysis[] = [
  {
    id: 'p1',
    name: 'Grilled Salmon Avocado Salad',
    image: '🥗',
    time: 'Today, 1:15 PM',
    isHealthy: true,
    classification: 'Healthy',
    macros: {
      calories: 450,
      protein: 34,
      carbohydrates: 12,
      fat: 28,
      fiber: 8,
    },
    pros: [
      'Rich in Omega-3 fatty acids which promote healthy cognitive and cardiovascular function.',
      'Excellent source of lean protein (34g) supporting muscle maintenance & recovery.',
      'Fiber-dense carbohydrates from fresh greens and avocado help sustain glucose levels.'
    ],
    cons: [
      'Relatively high fat content (though mostly healthy monounsaturated fats from avocado).',
      'Commercially prepared dressings may introduce excess sodium if not served on the side.'
    ],
    warnings: [
      'Contains fish (potential allergen).',
      'Dressing calorie dense: excessive pouring can double the overall fat macro.'
    ],
    suggestions: [
      'Opt for olive oil & lemon juice dressing to minimize processed sodium.',
      'Perfect match for your High Protein dietary preference!'
    ],
    explanation: 'A highly nutritious, low-glycemic lunch option that excels in micronutrients, healthy lipids, and high-quality protein.'
  },
  {
    id: 'p2',
    name: 'Double Cheeseburger with Fries',
    image: '🍔',
    time: 'Yesterday, 8:30 PM',
    isHealthy: false,
    classification: 'Unhealthy',
    macros: {
      calories: 980,
      protein: 42,
      carbohydrates: 95,
      fat: 48,
      fiber: 4,
    },
    pros: [
      'High protein yield (42g) from double beef patties.',
      'Quick energy replenishment from simple and complex carbohydrates.',
      'Provides essential minerals like iron, zinc, and calcium (cheese).'
    ],
    cons: [
      'Excessive saturated fats (48g) exceeding 70% of recommended daily value.',
      'Sodium surplus (1,650mg) which can elevate blood pressure.',
      'Refined flour in buns causes rapid insulin spikes followed by crashes.'
    ],
    warnings: [
      'High saturated fat content may aggravate heart health conditions.',
      'Exceeds standard single-meal sodium thresholds significantly.'
    ],
    suggestions: [
      'Consider replacing the fries with a side salad to cut carbs and calories.',
      'Substitute the brioche bun with a whole wheat option or lettuce wrap.'
    ],
    explanation: 'This meal contains highly processed fats, refined carbohydrates, and substantial sodium. Consuming this frequently poses long-term cardiovascular risks.'
  },
  {
    id: 'p3',
    name: 'Greek Yogurt Berry Parfait',
    image: '🍨',
    time: 'Yesterday, 8:15 AM',
    isHealthy: true,
    classification: 'Healthy',
    macros: {
      calories: 280,
      protein: 22,
      carbohydrates: 34,
      fat: 4,
      fiber: 6,
    },
    pros: [
      'High protein (22g) from non-fat Greek yogurt, helping keep appetite satiated.',
      'Loaded with antioxidants like anthocyanins from strawberries and blueberries.',
      'Probiotics in yogurt promote a thriving, healthy gut microbiome.'
    ],
    cons: [
      'Store-bought granola can contain high levels of hidden, added refined sugars.',
      'Very low healthy lipid profile, which minorly restricts absorption of fat-soluble vitamins.'
    ],
    warnings: [
      'Contains dairy (potential allergen/lactose sensitivity warning).',
      'Be cautious of honey/syrup drizzles which rapidly escalate simple sugar content.'
    ],
    suggestions: [
      'Add a teaspoon of chia seeds or crushed walnuts for essential omega-3 fat-soluble absorption.',
      'Excellent routine breakfast matching your balanced carbohydrate and digestive preference!'
    ],
    explanation: 'An outstanding morning meal. Greek yogurt provides high protein density, while berries supply low-index carbs and anti-inflammatory compounds.'
  },
  {
    id: 'p4',
    name: 'Pepperoni Pizza Slice (Thin Crust)',
    image: '🍕',
    time: '2 days ago, 2:10 PM',
    isHealthy: false,
    classification: 'Moderate',
    macros: {
      calories: 320,
      protein: 14,
      carbohydrates: 38,
      fat: 12,
      fiber: 2,
    },
    pros: [
      'Decent source of calcium from mozzarella cheese.',
      'Lycopene antioxidants found in the cooked tomato tomato pizza sauce.',
      'Moderate protein portion (14g) provides moderate satiety.'
    ],
    cons: [
      'Cured pepperoni meat contains sodium nitrates linked to inflammation.',
      'Thin crust offers high glycemic carbs with almost no dietary fiber digest.'
    ],
    warnings: [
      'Contains gluten and dairy allergens.',
      'Excess sodium: multiple slices aggravate fluid retention and blood pressure.'
    ],
    suggestions: [
      'Pair with a dark leafy green salad to decelerate digestion.',
      'Limit pepperoni count or opt for simple vegetable toppings like bell peppers/mushrooms.'
    ],
    explanation: 'Thin crust pizza is a moderate choice. Calories are kept sane, but refined wheat flour, sodium, and saturated fats from cheese/pepperoni are high.'
  },
  {
    id: 'p5',
    name: 'Avocado Toast with Poached Egg',
    image: '🥑',
    time: '3 days ago, 9:20 AM',
    isHealthy: true,
    classification: 'Healthy',
    macros: {
      calories: 380,
      protein: 16,
      carbohydrates: 28,
      fat: 22,
      fiber: 7,
    },
    pros: [
      'Abundant monounsaturated fats from avocado that protect arteries and cholesterol levels.',
      'Lutein and Zeaxanthin antioxidants in egg yolk protect macular sight.',
      'Slow-release carbs from sourdough and avocado fiber support extended cognitive focus.'
    ],
    cons: [
      'Sodium can easily escalate from external seasoning salts (flake salt, seasoning blend).',
      'Over-sized bread slices can skew the carb ratio from light to calorie heavy.'
    ],
    warnings: [
      'Contains eggs (allergen warning).'
    ],
    suggestions: [
      'Use rye or whole-wheat sourdough bread for maximum fiber benefits.',
      'Drizzle with lemon juice and a pinch of chili flakes instead of heavy salts.'
    ],
    explanation: 'A fantastic, nourishing meal. The synergistic combination of poached egg protein and avocado lipid oils yields sustained insulin curves and digestive satiety.'
  }
];

export const MOCK_HISTORY: FoodAnalysis[] = [
  { ...FOOD_PRESETS[0], id: 'h1', time: 'Today, 1:15 PM' },
  { ...FOOD_PRESETS[1], id: 'h2', time: 'Yesterday, 8:30 PM' },
  { ...FOOD_PRESETS[2], id: 'h3', time: 'Yesterday, 8:15 AM' },
  { ...FOOD_PRESETS[3], id: 'h4', time: '2 days ago, 2:10 PM' },
  { ...FOOD_PRESETS[4], id: 'h5', time: '3 days ago, 9:20 AM' },
];

export const TEAM_MEMBERS: UserAccount[] = [
  {
    id: 't1',
    name: 'Md Arafat Hossen',
    email: 'arafat.cse@nubtk.edu',
    status: 'Active',
    role: 'Admin',
    joinedDate: 'Aug 04, 2025',
    scansCount: 42,
  },
  {
    id: 't2',
    name: 'Md Saiful Islam Anik',
    email: 'saiful.c@nubtk.edu',
    status: 'Active',
    role: 'User',
    joinedDate: 'Aug 05, 2025',
    scansCount: 29,
  },
  {
    id: 't3',
    name: 'Md Azizul Haque Rifat',
    email: 'rifat.c@nubtk.edu',
    status: 'Active',
    role: 'User',
    joinedDate: 'Aug 06, 2025',
    scansCount: 31,
  },
  {
    id: 't4',
    name: 'Gazi Nafisa Maliat',
    email: 'nafisa.maliat912@gmail.com',
    status: 'Active',
    role: 'User',
    joinedDate: 'Aug 06, 2025',
    scansCount: 15,
  }
];

export const MOCK_USERS: UserAccount[] = [
  ...TEAM_MEMBERS,
  {
    id: 'u5',
    name: 'Sarah Rahman',
    email: 'sarah.r@outlook.com',
    status: 'Active',
    role: 'User',
    joinedDate: 'Sep 10, 2025',
    scansCount: 48,
  },
  {
    id: 'u6',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    status: 'Suspended',
    role: 'User',
    joinedDate: 'Oct 01, 2025',
    scansCount: 12,
  }
];

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 154,
  totalScans: 1248,
  activeUsers24h: 38,
  averageResponseTime: 1.8,
  systemStatus: 'Healthy',
  modelAccuracy: 96.4,
};

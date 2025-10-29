import { addDays, format, parseISO } from 'date-fns';
import type { Athlete, DayPlan, Meal, MealItem, MealType, Plan, TrainingDay } from '@/types/plan';

export type MacroProfile = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export const STANDARD_MACROS: MacroProfile = {
  kcal: 2400,
  protein: 110,
  fat: 75,
  carbs: 340
};

export const LIGHT_MACROS: MacroProfile = {
  kcal: 2000,
  protein: 90,
  fat: 60,
  carbs: 260
};

export const HYDRATION_BASELINE_ML = (weightKg: number) => ({
  min: Math.round(weightKg * 35),
  max: Math.round(weightKg * 40)
});

export const SESSION_FLUID_ML = 500;

const MEAL_LIBRARY: Record<MealType, MealItem[]> = {
  breakfast: [
    { name: 'Rolled oats with milk and banana', grams: 350, kcal: 520, protein: 20, fat: 12, carbs: 82 },
    { name: 'Plain yoghurt with dates and tahini', grams: 250, kcal: 320, protein: 16, fat: 10, carbs: 44 }
  ],
  lunch: [
    { name: 'Grilled chicken breast', grams: 150, kcal: 210, protein: 40, fat: 4, carbs: 0 },
    { name: 'Brown rice', grams: 200, kcal: 220, protein: 6, fat: 2, carbs: 46 },
    { name: 'Molokhia + whole-wheat pita', grams: 180, kcal: 180, protein: 6, fat: 4, carbs: 30 }
  ],
  dinner: [
    { name: 'Baked salmon or sardines', grams: 140, kcal: 260, protein: 32, fat: 14, carbs: 0 },
    { name: 'Sweet potato mash', grams: 180, kcal: 200, protein: 4, fat: 0, carbs: 48 },
    { name: 'Tomato-cucumber salad + olive oil', grams: 150, kcal: 120, protein: 3, fat: 7, carbs: 10 }
  ],
  snack: [
    { name: 'Labneh dip + carrots + cucumbers', grams: 160, kcal: 210, protein: 12, fat: 9, carbs: 20 },
    { name: 'Peanut butter on whole-grain toast', grams: 70, kcal: 240, protein: 9, fat: 11, carbs: 27 }
  ],
  pre: [
    { name: 'Banana + honey sandwich', grams: 150, kcal: 260, protein: 6, fat: 5, carbs: 50 },
    { name: 'Hydration: 300 mL water + pinch salt', grams: 300, kcal: 0, protein: 0, fat: 0, carbs: 0 }
  ],
  intra: [
    { name: 'Electrolyte drink', grams: 500, kcal: 80, protein: 0, fat: 0, carbs: 20 }
  ],
  post: [
    { name: 'Chocolate milk (low-fat)', grams: 300, kcal: 220, protein: 12, fat: 5, carbs: 32 },
    { name: 'Dates (2) + water', grams: 120, kcal: 90, protein: 1, fat: 0, carbs: 24 }
  ]
};

const LIGHT_DAY_ADJUSTMENTS: Partial<Record<MealType, MealItem[]>> = {
  breakfast: [
    { name: 'Overnight oats with chia and apple', grams: 300, kcal: 420, protein: 18, fat: 10, carbs: 60 }
  ],
  lunch: [
    { name: 'Tuna salad with couscous', grams: 260, kcal: 360, protein: 30, fat: 8, carbs: 40 }
  ],
  dinner: [
    { name: 'Lentil soup with whole-grain bread', grams: 320, kcal: 340, protein: 20, fat: 6, carbs: 46 }
  ],
  snack: [
    { name: 'Greek yoghurt + seasonal fruit', grams: 220, kcal: 180, protein: 15, fat: 0, carbs: 28 }
  ],
  pre: [
    { name: 'Banana + tahini drizzle', grams: 130, kcal: 200, protein: 5, fat: 7, carbs: 32 }
  ],
  post: [
    { name: 'Labneh smoothie with dates', grams: 260, kcal: 190, protein: 11, fat: 4, carbs: 26 }
  ]
};

const HYDRATION_NOTES = {
  breakfast: '350 mL water on waking + with meal',
  lunch: '400 mL water or karkade',
  dinner: '300 mL water or mint tea',
  snack: 'Fruit + 200 mL water',
  pre: '300 mL water with pinch of salt 45 min prior',
  intra: 'Sip 150–250 mL every 15–20 min',
  post: '400 mL water within 30 min'
};

const SNACKS = [
  'Banana with tahini',
  'Dates + almonds',
  'Yoghurt with honey',
  'Labneh with cucumber',
  'Peanut butter sandwich',
  'Chocolate milk',
  'Electrolyte drink'
];

const MAIN_MEALS = ['Breakfast', 'Lunch', 'Dinner'];

export function getWeekDates(startDate: string) {
  const start = parseISO(startDate);
  return Array.from({ length: 7 }).map((_, idx) => format(addDays(start, idx), 'yyyy-MM-dd'));
}

export function buildTrainingWeek(startDate: string, isLight = false): TrainingDay[] {
  const dates = getWeekDates(startDate);
  return dates.map((date, idx) => {
    const weekday = idx; // Sunday = 0
    const cfDays = ![2, 4].includes(weekday); // Wed (2), Fri (4)
    return {
      date,
      isLight: isLight || [2, 4].includes(weekday),
      runTimes: ['05:00', '16:00'],
      cfTimes: cfDays ? ['18:00-19:00'] : []
    } satisfies TrainingDay;
  });
}

function buildMeal(type: MealType, _profile: MacroProfile, isLight: boolean): Meal {
  const library = isLight && LIGHT_DAY_ADJUSTMENTS[type] ? LIGHT_DAY_ADJUSTMENTS[type]! : MEAL_LIBRARY[type];
  const normalizedItems = Array.isArray(library) ? library : [library];
  return {
    type,
    items: normalizedItems,
    notes:
      type === 'pre'
        ? '30–60 min before training; keep it light and familiar'
        : type === 'intra'
        ? 'Sip during sessions >60 min'
        : type === 'post'
        ? 'Within 30 min post-workout with 400 mL water'
        : HYDRATION_NOTES[type]
  };
}

function totalsForMeals(meals: Meal[]): { kcal: number; p: number; f: number; c: number } {
  return meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => {
        acc.kcal += item.kcal;
        acc.p += item.protein;
        acc.f += item.fat;
        acc.c += item.carbs;
      });
      return acc;
    },
    { kcal: 0, p: 0, f: 0, c: 0 }
  );
}

export function generateDayPlan(date: string, profile: MacroProfile, isLight: boolean, weightKg = 56.5): DayPlan {
  const meals: Meal[] = [];
  meals.push(buildMeal('breakfast', profile, isLight));
  meals.push(buildMeal('pre', profile, isLight));
  meals.push(buildMeal('lunch', profile, isLight));
  meals.push(buildMeal('snack', profile, isLight));
  meals.push(buildMeal('dinner', profile, isLight));
  meals.push(buildMeal('post', profile, isLight));

  const totals = totalsForMeals(meals);

  return {
    date,
    meals,
    waterMl: HYDRATION_BASELINE_ML(weightKg).max,
    totals: {
      kcal: Math.round(profile.kcal),
      p: Math.round(profile.protein),
      f: Math.round(profile.fat),
      c: Math.round(profile.carbs)
    }
  };
}

export function generatePlan(athlete: Athlete, startDate: string, profile: MacroProfile): Plan {
  const training = buildTrainingWeek(startDate, profile === LIGHT_MACROS);
  const days = training.map((day) => generateDayPlan(day.date, day.isLight ? LIGHT_MACROS : profile, day.isLight, athlete.weightKg));
  return {
    weekStart: 'sunday',
    timezone: 'Africa/Cairo',
    athlete,
    training,
    days
  };
}

export function generatePlanFromTraining(athlete: Athlete, training: TrainingDay[], profile: MacroProfile): Plan {
  const days = training.map((day) => generateDayPlan(day.date, day.isLight ? LIGHT_MACROS : profile, day.isLight, athlete.weightKg));
  return {
    weekStart: 'sunday',
    timezone: 'Africa/Cairo',
    athlete,
    training,
    days
  };
}

export function formatWaterMl(weightKg: number) {
  const base = HYDRATION_BASELINE_ML(weightKg);
  return `${base.min} – ${base.max} mL baseline + 500 mL per intense session`;
}

export function getSnackOptions() {
  return SNACKS;
}

export function getMainMealNames() {
  return MAIN_MEALS;
}

export function buildTaperChecklist(competitionStart: string) {
  const start = parseISO(competitionStart);
  return Array.from({ length: 7 }).map((_, idx) => {
    const date = format(addDays(start, -6 + idx), 'yyyy-MM-dd');
    const dayLabel = idx < 6 ? `-${6 - idx} days` : 'Competition day';
    const guidance = [
      'Prioritize complex carbs (rice, pasta, sweet potato) at each meal',
      'Include 500-750 mL electrolyte drink daily',
      'Salt food lightly to boost sodium stores'
    ];
    if (idx >= 4) {
      guidance.push('Shift to lower fiber options in the evening');
    }
    if (idx >= 5) {
      guidance.push('Pack competition snacks: dates, banana, yoghurt smoothie');
    }
    if (idx === 6) {
      guidance.push('Breakfast 3 h pre-event: oats + yoghurt + banana');
      guidance.push('Between events: chocolate milk, electrolyte sips, rice cakes + honey');
    }
    return {
      date,
      dayLabel,
      guidance
    };
  });
}

export function aggregateGroceryList(plan: Plan) {
  const map = new Map<string, { grams: number; kcal: number }>();
  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        if (!map.has(item.name)) {
          map.set(item.name, { grams: 0, kcal: 0 });
        }
        const current = map.get(item.name)!;
        current.grams += item.grams;
        current.kcal += item.kcal;
      });
    });
  });
  return Array.from(map.entries())
    .map(([name, info]) => ({
      name,
      grams: Math.round(info.grams),
      kcal: Math.round(info.kcal)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

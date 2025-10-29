export type Athlete = {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  goal: string;
  halal: boolean;
  vegetarian?: boolean;
  allergies: string[];
};

export type TrainingDay = {
  date: string;
  isLight: boolean;
  runTimes: string[];
  cfTimes: string[];
};

export type MealItem = {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre' | 'intra' | 'post';

export type Meal = {
  type: MealType;
  items: MealItem[];
  notes?: string;
};

export type DayPlan = {
  date: string;
  meals: Meal[];
  waterMl: number;
  totals: {
    kcal: number;
    p: number;
    f: number;
    c: number;
  };
};

export type Plan = {
  weekStart: 'sunday';
  timezone: 'Africa/Cairo';
  athlete: Athlete;
  training: TrainingDay[];
  days: DayPlan[];
};

export type CaffeineSettings = {
  maxMgUnder18: number;
  bedtimeBufferHours: number;
  redBullZeroMg: number;
  redBullZeroSugarG: number;
  whiteEditionMg: number;
  whiteEditionSugarG: number;
};

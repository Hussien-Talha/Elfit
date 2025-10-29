import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  try {
    return new Error(JSON.stringify(error));
  } catch (jsonError) {
    return new Error(String(error));
  }
}

export const KG_TO_KCAL_RANGE = { min: 40, max: 45 };
export const HYDRATION_ML_PER_KG = { min: 35, max: 40 };

export const DEFAULT_ATHLETE = {
  age: 14,
  sex: 'male' as const,
  heightCm: 168,
  weightKg: 56.5,
  goal: 'lean, high-energy performance',
  halal: true,
  allergies: [] as string[]
};

export const DEFAULT_COMPETITION = {
  start: '2025-11-19',
  end: '2025-11-22'
};

export const DEFAULT_RUN_TIMES = ['05:00', '16:00'];
export const DEFAULT_CF_TIMES = ['18:00-19:00', '19:00-20:00', '20:00-21:00'];

export const DEFAULT_PLAN_MODE = 'standard';

export const FOOD_DB = [
  { name: 'Rolled oats', serving: '60 g', kcal: 228, protein: 8, fat: 4, carbs: 40 },
  { name: 'Eggs', serving: '2 large', kcal: 140, protein: 12, fat: 9, carbs: 1 },
  { name: 'Fava beans (ful medames)', serving: '1 cup cooked', kcal: 240, protein: 13, fat: 4, carbs: 40 },
  { name: 'Tuna (canned in water)', serving: '120 g drained', kcal: 150, protein: 32, fat: 2, carbs: 0 },
  { name: 'Chicken breast', serving: '120 g cooked', kcal: 198, protein: 37, fat: 4, carbs: 0 },
  { name: 'Brown rice', serving: '150 g cooked', kcal: 165, protein: 4, fat: 1.5, carbs: 34 },
  { name: 'White rice', serving: '150 g cooked', kcal: 195, protein: 4, fat: 0.5, carbs: 43 },
  { name: 'Greek yoghurt', serving: '170 g', kcal: 100, protein: 17, fat: 0, carbs: 6 },
  { name: 'Plain yoghurt', serving: '200 g', kcal: 130, protein: 9, fat: 3, carbs: 15 },
  { name: 'Tahini', serving: '1 tbsp', kcal: 89, protein: 3, fat: 8, carbs: 3 },
  { name: 'Dates', serving: '3 medium', kcal: 66, protein: 1, fat: 0, carbs: 18 },
  { name: 'Banana', serving: '1 medium', kcal: 105, protein: 1, fat: 0, carbs: 27 },
  { name: 'Lentils (red)', serving: '1 cup cooked', kcal: 230, protein: 18, fat: 1, carbs: 40 },
  { name: 'Sardines (canned)', serving: '90 g', kcal: 190, protein: 21, fat: 10, carbs: 0 },
  { name: 'Labneh', serving: '60 g', kcal: 120, protein: 6, fat: 8, carbs: 6 },
  { name: 'Molokhia stew', serving: '1 cup', kcal: 85, protein: 4, fat: 4, carbs: 9 },
  { name: 'Couscous', serving: '1 cup cooked', kcal: 176, protein: 6, fat: 1, carbs: 36 },
  { name: 'Sweet potato', serving: '1 medium baked', kcal: 160, protein: 3, fat: 0, carbs: 37 },
  { name: 'Potatoes (boiled)', serving: '200 g', kcal: 166, protein: 4, fat: 0, carbs: 38 },
  { name: 'Whole-grain pasta', serving: '1 cup cooked', kcal: 174, protein: 7, fat: 1, carbs: 37 },
  { name: 'Hummus', serving: '1/2 cup', kcal: 180, protein: 6, fat: 8, carbs: 20 },
  { name: 'Peanut butter', serving: '1 tbsp', kcal: 95, protein: 4, fat: 8, carbs: 4 },
  { name: 'Cottage cheese', serving: '100 g', kcal: 98, protein: 12, fat: 4, carbs: 3 }
];

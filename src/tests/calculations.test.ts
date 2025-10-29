import { describe, expect, it } from 'vitest';
import {
  STANDARD_MACROS,
  LIGHT_MACROS,
  HYDRATION_BASELINE_ML,
  buildTaperChecklist,
  aggregateGroceryList,
  generatePlan
} from '@/lib/calculations';
import { DEFAULT_ATHLETE } from '@/lib/utils';

describe('nutrition calculations', () => {
  it('provides standard macros aligned with specification', () => {
    expect(STANDARD_MACROS.kcal).toBe(2400);
    expect(STANDARD_MACROS.protein).toBe(110);
  });

  it('calculates hydration baseline', () => {
    const range = HYDRATION_BASELINE_ML(56.5);
    expect(range.min).toBeCloseTo(1978, 0);
    expect(range.max).toBeCloseTo(2260, 0);
  });

  it('builds taper checklist for 7 days', () => {
    const list = buildTaperChecklist('2025-11-19');
    expect(list).toHaveLength(7);
    expect(list[6].dayLabel).toEqual('Competition day');
  });

  it('aggregates grocery list entries', () => {
    const plan = generatePlan(DEFAULT_ATHLETE, '2025-11-16', STANDARD_MACROS);
    const groceries = aggregateGroceryList(plan);
    const oats = groceries.find((item) => item.name.includes('oats'));
    expect(oats).toBeTruthy();
  });
});

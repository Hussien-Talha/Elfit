'use client';

import * as React from 'react';
import type { Plan } from '@/types/plan';
import { toError } from '@/lib/utils';

const STORAGE_KEY = 'elfit-last-plan';

export function useLocalPlan(plan: Plan | null) {
  React.useEffect(() => {
    if (plan) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  }, [plan]);

  const load = React.useCallback((): Plan | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Plan;
    } catch (error) {
      console.error(toError(error));
      return null;
    }
  }, []);

  return { load };
}

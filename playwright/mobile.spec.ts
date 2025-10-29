import { test, expect } from '@playwright/test';

test('planner renders on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ELFIT Rookie Fuel Planner' })).toBeVisible();
  await expect(page.getByText('Section A — Overview')).toBeVisible();
});

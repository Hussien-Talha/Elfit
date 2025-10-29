# ELFIT Rookie Fuel Planner

Mobile-first Next.js (App Router) application that builds a science-informed, adolescent-safe competition nutrition plan for ELFIT Rookies athletes in Cairo (UTC+2/3).

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS + custom shadcn-style UI primitives
- React Hook Form + Zod validation
- MongoDB via route handlers for plan persistence
- next-pwa for installable PWA & offline cache of last generated plan
- jsPDF / PapaParse / ics for export (PDF, CSV, calendar)
- Vitest for unit tests, Playwright for mobile smoke test

## Getting started

```bash
pnpm install
pnpm dev
```

Create a `.env` file based on `.env.example` and provide `MONGODB_URI`.

### Scripts

- `pnpm dev` – run development server
- `pnpm build` – create production build
- `pnpm start` – run production build
- `pnpm test` – run Vitest unit tests
- `pnpm test:ui` – run Playwright mobile smoke test

## Core assumptions

- Training energy needs: 40–45 kcal/kg (≈2,400 kcal standard day for 56.5 kg athlete)
- Light day reduction: ~400 kcal drop via carbohydrate and fat adjustments (2,000 kcal)
- Protein: 1.6–2.0 g/kg (110 g standard, 90 g light)
- Hydration baseline: 35–40 mL/kg/day plus ~500 mL per intense session
- Week runs Sunday → Saturday, Africa/Cairo timezone
- Default competition dates: 19–22 Nov 2025

## Features

- Inputs for anthropometrics, dietary preferences (Halal, vegetarian, allergies), Ramadan toggle, caffeine visibility, electrolytes emphasis
- Editable training schedule with run and CrossFit slots, automatic light day logic
- Real-time recalculated plan sections A–F (overview, fueling table, taper checklist, grocery & prep, caffeine guidance, substitutions)
- Egypt-friendly food database (oats, ful, tahini, molokhia, etc.)
- Export to PDF, CSV, and `.ics` calendar
- Offline caching of last generated plan via localStorage + PWA install prompt
- MongoDB persistence to save/load most recent plan
- Accessibility-first: semantic HTML, keyboard focus states, WCAG-friendly color contrast

## Customization notes

- Update food templates in `src/lib/calculations.ts` to tweak meal items/macros.
- Extend UI primitives in `src/components/ui` to match brand guidelines.
- Adjust taper checklist logic via `buildTaperChecklist` helper in `src/lib/calculations.ts`.

## Testing

- Vitest unit tests cover nutrition calculations.
- Playwright smoke test validates mobile rendering (iPhone 12 viewport).

## Deployment

- Provide `MONGODB_URI` in production environment.
- Enable PWA caching via `next-pwa` (auto disabled in development).
- Configure hosting (e.g., Vercel) with environment variables and MongoDB Atlas cluster.

### Pushing to GitHub

1. [Create a new repository](https://github.com/new) or select an existing one.
2. Initialize the repo locally if needed:

   ```bash
   git init
   git remote add origin git@github.com:<username>/<repo>.git
   ```

3. Commit your work and push:

   ```bash
   git add .
   git commit -m "feat: add planner"
   git push -u origin main
   ```

### Deploying to GitHub Pages

GitHub Pages serves static assets only. The app can fall back to local storage (no MongoDB API) when built in static mode.

1. Create an `.env.production` (or export env vars in CI) with:

   ```bash
   NEXT_STATIC_EXPORT=true
   NEXT_PUBLIC_STATIC_EXPORT=true
   NEXT_PUBLIC_BASE_PATH=/<repo-name>
   ```

2. Build the static bundle:

   ```bash
   NEXT_STATIC_EXPORT=true NEXT_PUBLIC_STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/<repo-name> pnpm build
   ```

   This produces an `out/` directory ready for GitHub Pages.

3. Publish the `out/` folder. You can push it to a `gh-pages` branch (via `git subtree`) or use GitHub Actions with `peaceiris/actions-gh-pages`.

4. Because GitHub Pages is static-only, cloud save/load buttons are disabled. Users rely on offline caching and local storage to keep the latest plan.

import { Planner } from '@/components/planner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">ELFIT Rookie Fuel Planner</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Mobile-first, adolescent-safe fueling plan for Africa/Cairo (UTC+2/3) — week runs Sunday → Saturday.
          </p>
        </div>
        <ThemeToggle />
      </header>
      <Planner />
    </main>
  );
}

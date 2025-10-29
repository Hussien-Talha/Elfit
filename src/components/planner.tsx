'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, startOfWeek } from 'date-fns';
import { DEFAULT_ATHLETE, DEFAULT_COMPETITION } from '@/lib/utils';
import {
  STANDARD_MACROS,
  LIGHT_MACROS,
  generatePlanFromTraining,
  formatWaterMl,
  buildTaperChecklist,
  aggregateGroceryList
} from '@/lib/calculations';
import type { Plan, TrainingDay } from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { exportPlanToCSV, exportPlanToICS, exportPlanToPDF } from '@/lib/exporters';
import { useLocalPlan } from '@/hooks/use-local-plan';
import { CloudUpload, CloudDownload, Calendar, FileText, FileSpreadsheet } from 'lucide-react';

const planSchema = z.object({
  age: z.coerce.number().min(12).max(18),
  sex: z.enum(['male', 'female']).default('male'),
  heightCm: z.coerce.number().min(140).max(210),
  weightKg: z.coerce.number().min(35).max(100),
  goal: z.string().min(3),
  halal: z.boolean().default(true),
  vegetarian: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  allergyInput: z.string().optional(),
  weekStartDate: z.string(),
  competitionStart: z.string(),
  competitionEnd: z.string(),
  planMode: z.enum(['standard', 'light']).default('standard'),
  ramadan: z.boolean().default(false),
  caffeine: z.boolean().default(true),
  electrolytes: z.boolean().default(true)
});

const CF_SLOTS = ['18:00-19:00', '19:00-20:00', '20:00-21:00'];
const RUN_SLOTS = ['05:00', '16:00'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type PlannerForm = z.infer<typeof planSchema>;

type DaySchedule = {
  dayName: string;
  date: string;
  runSlots: string[];
  cfSlots: string[];
  isLight: boolean;
};

function getDefaultWeekStart() {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

function createInitialSchedule(weekStart: string, planMode: 'standard' | 'light'): DaySchedule[] {
  return DAYS.map((dayName, index) => {
    const date = format(addDays(new Date(weekStart), index), 'yyyy-MM-dd');
    const isCFDay = !['Wednesday', 'Friday'].includes(dayName);
    const baseLight = ['Wednesday', 'Friday'].includes(dayName);
    return {
      dayName,
      date,
      runSlots: [...RUN_SLOTS],
      cfSlots: isCFDay ? ['18:00-19:00'] : [],
      isLight: planMode === 'light' || baseLight
    };
  });
}

function convertToTrainingDays(schedule: DaySchedule[]): TrainingDay[] {
  return schedule.map((item) => ({
    date: item.date,
    isLight: item.isLight,
    runTimes: item.runSlots,
    cfTimes: item.cfSlots
  }));
}

function formatMealType(type: string) {
  switch (type) {
    case 'pre':
      return 'Pre-workout';
    case 'post':
      return 'Post-workout';
    case 'intra':
      return 'Intra-session';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function Planner() {
  const form = useForm<PlannerForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      age: DEFAULT_ATHLETE.age,
      sex: DEFAULT_ATHLETE.sex,
      heightCm: DEFAULT_ATHLETE.heightCm,
      weightKg: DEFAULT_ATHLETE.weightKg,
      goal: DEFAULT_ATHLETE.goal,
      halal: true,
      vegetarian: false,
      allergies: [],
      weekStartDate: getDefaultWeekStart(),
      competitionStart: DEFAULT_COMPETITION.start,
      competitionEnd: DEFAULT_COMPETITION.end,
      planMode: 'standard',
      ramadan: false,
      caffeine: true,
      electrolytes: true
    }
  });

  const watched = form.watch();
  const planMode = watched.planMode;
  const weightKg = watched.weightKg;
  const weekStartDate = watched.weekStartDate;
  const competitionStart = watched.competitionStart;

  const [schedule, setSchedule] = React.useState<DaySchedule[]>(() => createInitialSchedule(weekStartDate, planMode));
  const [notes, setNotes] = React.useState({
    overview: 'Focus on balanced fueling, good sleep, and hydration. Adjust as the athlete gives feedback.',
    troubleshooting: 'Monitor appetite, digestion, energy, and sleep. Tweak textures and meal timing if needed.'
  });
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSchedule((prev) => {
      if (prev.length === 7) {
        return prev.map((day, index) => {
          const date = format(addDays(new Date(weekStartDate), index), 'yyyy-MM-dd');
          const baseLight = ['Wednesday', 'Friday'].includes(DAYS[index]);
          return {
            ...day,
            dayName: DAYS[index],
            date,
            isLight: planMode === 'light' ? true : baseLight ? true : day.isLight
          };
        });
      }
      return createInitialSchedule(weekStartDate, planMode);
    });
  }, [weekStartDate, planMode]);

  const macros = planMode === 'light' ? LIGHT_MACROS : STANDARD_MACROS;

  const planAthlete = React.useMemo(
    () => ({
      age: watched.age,
      sex: watched.sex,
      heightCm: watched.heightCm,
      weightKg: watched.weightKg,
      goal: watched.goal,
      halal: watched.halal,
      vegetarian: watched.vegetarian,
      allergies: watched.allergies
    }),
    [watched]
  );

  const isStaticMode = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

  const plan = React.useMemo<Plan>(() => {
    const training = convertToTrainingDays(schedule);
    return generatePlanFromTraining(planAthlete, training, macros);
  }, [schedule, planAthlete, macros]);

  const { load } = useLocalPlan(plan);

  React.useEffect(() => {
    const stored = load();
    if (stored) {
      form.reset({
        age: stored.athlete.age,
        sex: stored.athlete.sex,
        heightCm: stored.athlete.heightCm,
        weightKg: stored.athlete.weightKg,
        goal: stored.athlete.goal,
        halal: stored.athlete.halal,
        vegetarian: stored.athlete.vegetarian ?? false,
        allergies: stored.athlete.allergies,
        weekStartDate: stored.days[0]?.date ?? getDefaultWeekStart(),
        competitionStart: competitionStart,
        competitionEnd: form.getValues('competitionEnd'),
        planMode: planMode,
        ramadan: form.getValues('ramadan'),
        caffeine: form.getValues('caffeine'),
        electrolytes: form.getValues('electrolytes')
      });
      setSchedule(stored.training.map((day, idx) => ({
        dayName: DAYS[idx],
        date: day.date,
        runSlots: day.runTimes,
        cfSlots: day.cfTimes,
        isLight: day.isLight
      })));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const taperChecklist = React.useMemo(() => buildTaperChecklist(competitionStart), [competitionStart]);
  const groceryList = React.useMemo(() => aggregateGroceryList(plan), [plan]);
  const hydrationBaseline = formatWaterMl(weightKg);

  const onAddAllergy = React.useCallback(() => {
    const value = form.getValues('allergyInput');
    if (value && value.trim().length > 0) {
      const allergies = new Set(form.getValues('allergies'));
      allergies.add(value.trim());
      form.setValue('allergies', Array.from(allergies));
      form.setValue('allergyInput', '');
    }
  }, [form]);

  const handleScheduleToggle = (dayIndex: number, value: Partial<DaySchedule>) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], ...value };
      return next;
    });
  };

  const handleSaveCloud = async () => {
    if (isStaticMode) {
      setStatus('Cloud sync disabled on static (GitHub Pages) build');
      return;
    }
    try {
      setStatus('Saving...');
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (!response.ok) throw new Error('Request failed');
      setStatus('Saved securely');
    } catch (error) {
      console.error(error);
      setStatus('Save failed');
    }
  };

  const handleLoadCloud = async () => {
    if (isStaticMode) {
      setStatus('Cloud sync disabled on static (GitHub Pages) build');
      return;
    }
    try {
      setStatus('Loading...');
      const response = await fetch('/api/plan');
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      if (data?.plan) {
        form.reset({
          age: data.plan.athlete.age,
          sex: data.plan.athlete.sex,
          heightCm: data.plan.athlete.heightCm,
          weightKg: data.plan.athlete.weightKg,
          goal: data.plan.athlete.goal,
          halal: data.plan.athlete.halal,
          vegetarian: data.plan.athlete.vegetarian ?? false,
          allergies: data.plan.athlete.allergies,
          weekStartDate: data.plan.training[0]?.date ?? getDefaultWeekStart(),
          competitionStart,
          competitionEnd: form.getValues('competitionEnd'),
          planMode,
          ramadan: form.getValues('ramadan'),
          caffeine: form.getValues('caffeine'),
          electrolytes: form.getValues('electrolytes')
        });
        setSchedule(data.plan.training.map((day: TrainingDay, idx: number) => ({
          dayName: DAYS[idx],
          date: day.date,
          runSlots: day.runTimes,
          cfSlots: day.cfTimes,
          isLight: day.isLight
        })));
        setStatus('Plan loaded');
      } else {
        setStatus('No saved plan yet');
      }
    } catch (error) {
      console.error(error);
      setStatus('Load failed');
    }
  };

  const competitionRange = `${competitionStart} → ${watched.competitionEnd}`;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Card className="bg-white/90 dark:bg-slate-900/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>Personalize the nutrition map for the ELFIT Rookies athlete.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" {...form.register('age', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <select
                id="sex"
                {...form.register('sex')}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input id="height" type="number" step="0.1" {...form.register('heightCm', { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" step="0.1" {...form.register('weightKg', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="goal">Body composition goal</Label>
              <Input id="goal" {...form.register('goal')} />
            </div>
            <div>
              <Label htmlFor="weekStartDate">Week starting (Sunday)</Label>
              <Input id="weekStartDate" type="date" {...form.register('weekStartDate')} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Controller
                name="halal"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Switch id="halal" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="halal">Halal meals only</Label>
                  </>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                name="vegetarian"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Switch id="vegetarian" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="vegetarian">Vegetarian pattern</Label>
                  </>
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <Controller
                name="ramadan"
                control={form.control}
                render={({ field }) => (
                  <>
                    <Switch id="ramadan" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="ramadan">Include Ramadan guidance</Label>
                  </>
                )}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Allergies / intolerances</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add allergy (e.g., lactose)"
                {...form.register('allergyInput')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onAddAllergy();
                  }
                }}
              />
              <Button type="button" onClick={onAddAllergy} variant="secondary">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('allergies').map((item) => (
                <span key={item} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="mr-4 text-sm font-semibold">Plan mode</Label>
              <Tabs value={planMode} onValueChange={(value) => form.setValue('planMode', value as 'standard' | 'light')}>
                <TabsList>
                  <TabsTrigger value="standard">Standard day</TabsTrigger>
                  <TabsTrigger value="light">Light day</TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="text-xs text-slate-500">Switch to see macro updates instantly.</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Controller
                  name="caffeine"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Switch id="caffeine" checked={field.value} onCheckedChange={field.onChange} />
                      <Label htmlFor="caffeine">Show caffeine module</Label>
                    </>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="electrolytes"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <Switch id="electrolytes" checked={field.value} onCheckedChange={field.onChange} />
                      <Label htmlFor="electrolytes">Highlight electrolytes</Label>
                    </>
                  )}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                Competition: {competitionRange}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training schedule</CardTitle>
          <CardDescription>Tick the sessions for each day. Rest/light days auto-adjust the fueling table.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {schedule.map((day, index) => (
            <div key={day.dayName} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{day.dayName}</p>
                  <p className="text-xs text-slate-500">{day.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`light-${index}`} className="text-xs text-slate-600">
                    Light day?
                  </Label>
                  <Switch
                    id={`light-${index}`}
                    checked={day.isLight}
                    onCheckedChange={(checked) => handleScheduleToggle(index, { isLight: checked })}
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Runs</p>
                  <div className="flex flex-wrap gap-3">
                    {RUN_SLOTS.map((slot) => (
                      <label key={slot} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={day.runSlots.includes(slot)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? Array.from(new Set([...day.runSlots, slot]))
                              : day.runSlots.filter((time) => time !== slot);
                            handleScheduleToggle(index, { runSlots: next });
                          }}
                        />
                        {slot}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">CrossFit</p>
                  <div className="flex flex-wrap gap-3">
                    {CF_SLOTS.map((slot) => (
                      <label key={slot} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={day.cfSlots.includes(slot)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? Array.from(new Set([...day.cfSlots, slot]))
                              : day.cfSlots.filter((time) => time !== slot);
                            handleScheduleToggle(index, { cfSlots: next });
                          }}
                          disabled={['Wednesday', 'Friday'].includes(day.dayName)}
                        />
                        {slot}
                      </label>
                    ))}
                    {day.cfSlots.length === 0 && <p className="text-xs text-amber-600">Rest / active recovery evening.</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="print-container">
        <CardHeader>
          <CardTitle>Section A — Overview</CardTitle>
          <CardDescription>Quick look at targets, calories, and hydration for the week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Energy & macros</p>
              <p className="mt-2 text-sm">Standard day: {STANDARD_MACROS.kcal} kcal • P {STANDARD_MACROS.protein} g • F {STANDARD_MACROS.fat} g • C {STANDARD_MACROS.carbs} g</p>
              <p className="text-sm">Light day: {LIGHT_MACROS.kcal} kcal • P {LIGHT_MACROS.protein} g • F {LIGHT_MACROS.fat} g • C {LIGHT_MACROS.carbs} g</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hydration</p>
              <p className="mt-2 text-sm">Baseline: {hydrationBaseline}</p>
              <p className="text-sm">Add ~500 mL per intense session (runs + CrossFit).</p>
            </div>
          </div>
          <Textarea
            value={notes.overview}
            onChange={(event) => setNotes((prev) => ({ ...prev, overview: event.target.value }))}
            aria-label="Overview notes"
          />
        </CardContent>
      </Card>

      <Card className="print-container">
        <CardHeader>
          <CardTitle>Section B — 7-day fueling table</CardTitle>
          <CardDescription>Meals and hydration from Sunday to Saturday with macro totals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.days.map((day, dayIndex) => (
            <div key={day.date} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {DAYS[dayIndex]} — {day.date}
                </p>
                <span className="text-xs text-slate-500">{schedule[dayIndex]?.isLight ? 'Light adjustments applied' : 'Standard fueling'}</span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2">Meal</th>
                      <th className="py-2">Items</th>
                      <th className="py-2">Hydration</th>
                      <th className="py-2">kcal</th>
                      <th className="py-2">P (g)</th>
                      <th className="py-2">F (g)</th>
                      <th className="py-2">C (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.meals.map((meal) => {
                      const mealKcal = meal.items.reduce((sum, item) => sum + item.kcal, 0);
                      const mealProtein = meal.items.reduce((sum, item) => sum + item.protein, 0);
                      const mealFat = meal.items.reduce((sum, item) => sum + item.fat, 0);
                      const mealCarb = meal.items.reduce((sum, item) => sum + item.carbs, 0);
                      return (
                        <tr key={meal.type} className="border-b border-slate-100 align-top">
                          <td className="py-2 font-medium">{formatMealType(meal.type)}</td>
                          <td className="py-2">
                            <ul className="list-disc space-y-1 pl-4">
                              {meal.items.map((item) => (
                                <li key={item.name} className="leading-snug">
                                  {item.name} <span className="text-xs text-slate-500">({item.grams} g)</span>
                                </li>
                              ))}
                            </ul>
                            {meal.notes && <p className="mt-2 text-xs text-slate-500">{meal.notes}</p>}
                          </td>
                          <td className="py-2 text-xs text-slate-500">{meal.notes?.includes('water') ? meal.notes : 'Sip water throughout'}</td>
                          <td className="py-2">{mealKcal}</td>
                          <td className="py-2">{mealProtein}</td>
                          <td className="py-2">{mealFat}</td>
                          <td className="py-2">{mealCarb}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>Daily total: {day.totals.kcal} kcal • P {day.totals.p} g • F {day.totals.f} g • C {day.totals.c} g</span>
                <span>Water target: {day.waterMl} mL</span>
                <span>Runs: {schedule[dayIndex]?.runSlots.join(', ') || 'Rest'}</span>
                <span>CrossFit: {schedule[dayIndex]?.cfSlots.join(', ') || 'None'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="print-container">
        <CardHeader>
          <CardTitle>Section C — Competition week taper</CardTitle>
          <CardDescription>Seven-day checklist leading into ELFIT Rookies (Africa/Cairo).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {taperChecklist.map((item) => (
            <div key={item.date} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">
                {item.date} ({item.dayLabel})
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {item.guidance.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="print-container">
        <CardHeader>
          <CardTitle>Section D — Grocery list & meal prep</CardTitle>
          <CardDescription>Shop once, prep twice. Quantities cover the full training week.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2">Item</th>
                  <th className="py-2">Approx. grams</th>
                  <th className="py-2">Energy reserve (kcal)</th>
                </tr>
              </thead>
              <tbody>
                {groceryList.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2">{row.grams}</td>
                    <td className="py-2">{row.kcal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">Batch prep 1 — Weekend (2 h)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Cook rice, couscous, and sweet potatoes; portion into airtight containers (3-day fridge limit).</li>
                <li>Boil eggs, prep tuna salad jars with lemon + olive oil.</li>
                <li>Blend smoothie packs (yoghurt, banana, dates) and freeze for quick post-workout use.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">Batch prep 2 — Midweek top-up (60 min)</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Grill chicken + vegetables, store for 3 days (keep 4°C or colder).</li>
                <li>Prepare lentil soup and portion; freeze half for taper week.</li>
                <li>Cut fruit + veg sticks, store with damp paper towel to keep crisp.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {form.watch('caffeine') && (
        <Card className="print-container border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle>Section E — Caffeine & energy drinks</CardTitle>
            <CardDescription className="text-amber-700">
              ⚠️ Under-18 caution: keep caffeine & stimulants below 100 mg/day and avoid 6 h before sleep.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Recommended limit: &lt;100 mg/day (bedtime buffer ≥6 h). Use only with guardian/coach approval.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-amber-200 bg-white p-3">
                <p className="font-semibold">Product facts</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Red Bull Zero Sugar (250 mL): 80 mg caffeine, 0 g sugar</li>
                  <li>Red Bull White Edition (250 mL): 80 mg caffeine, ~27 g sugar</li>
                  <li>Verdict: Both are <strong>not recommended</strong> for under-18 athletes.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-white p-3">
                <p className="font-semibold">Safer pre-workout options</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Electrolyte drink (200–300 mL) with light carbs</li>
                  <li>Chocolate milk 60–90 min pre-session</li>
                  <li>Banana + water, or yoghurt smoothie with dates</li>
                  <li>Coconut water + pinch of salt on hot days</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-amber-700">If caffeine is used, schedule it 60–90 min pre-workout and avoid within 6 h of bedtime.</p>
          </CardContent>
        </Card>
      )}

      <Card className="print-container">
        <CardHeader>
          <CardTitle>Section F — Substitutions & troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2">Swap this</th>
                  <th className="py-2">For this</th>
                  <th className="py-2">Why it works</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Chicken breast', 'Tuna or sardines', 'Keeps protein high with more omega-3 fats'],
                  ['Rice', 'Potato or sweet potato', 'Similar carbs, easier on stomach for some athletes'],
                  ['Oats', 'Whole-grain cereal', 'Quick prep when mornings are rushed'],
                  ['Yoghurt', 'Milk + tahini', 'Maintains protein + healthy fats for smoothies'],
                  ['Dates', 'Banana + honey', 'Fast carbs before sessions with familiar flavors'],
                  ['Hummus', 'Eggs + carrot sticks', 'Protein + crunch when chickpeas not available']
                ].map(([from, to, reason]) => (
                  <tr key={from} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{from}</td>
                    <td className="py-2">{to}</td>
                    <td className="py-2 text-slate-600">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold">Troubleshooting</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Low appetite: use smoothies, soups, and yoghurt bowls to reduce chewing fatigue.</li>
                <li>GI distress: reduce fat/fiber in pre-workout meal, keep hydration cool not icy.</li>
                <li>Dehydration: set 250 mL sips every 45 min and add a pinch of salt to water.</li>
                <li>Sleep: finish caffeine by 14:00, use warm milk + banana if hungry before bed.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold">Ramadan focus</p>
              {form.watch('ramadan') ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Suhoor: oats + milk + dates + nuts for slow energy; hydrate with 500 mL water + pinch salt.</li>
                  <li>Iftar: break fast with water + 2 dates, then soup, lean protein, and rice/potatoes.</li>
                  <li>Shift main training to after Taraweeh if possible; use lighter technique sessions while fasting.</li>
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Toggle “Include Ramadan guidance” to reveal tailored tips.</p>
              )}
            </div>
          </div>
          <Textarea
            value={notes.troubleshooting}
            onChange={(event) => setNotes((prev) => ({ ...prev, troubleshooting: event.target.value }))}
            aria-label="Troubleshooting notes"
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:bg-slate-900/95">
        <Button type="button" variant="outline" onClick={() => exportPlanToPDF(plan)} className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> Export PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => exportPlanToCSV(plan)} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Export CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => exportPlanToICS(plan)} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Export .ics
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={handleSaveCloud}
            className="flex items-center gap-2"
            disabled={isStaticMode}
          >
            <CloudUpload className="h-4 w-4" /> Save to cloud
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadCloud}
            className="flex items-center gap-2"
            disabled={isStaticMode}
          >
            <CloudDownload className="h-4 w-4" /> Load plan
          </Button>
        </div>
        {status && <span className="text-xs text-slate-500">{status}</span>}
        {isStaticMode && (
          <span className="text-xs text-amber-600">
            Cloud sync requires a server deployment; static GitHub Pages builds rely on device storage only.
          </span>
        )}
      </div>
    </div>
  );
}

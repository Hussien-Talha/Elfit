'use client';

import jsPDF from 'jspdf';
import { unparse } from 'papaparse';
import download from 'js-file-download';
import { createEvents } from 'ics';
import type { Plan } from '@/types/plan';
import { toError } from '@/lib/utils';

export function exportPlanToPDF(plan: Plan) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ELFIT Rookie Fuel Planner', 40, y);
  y += 30;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Athlete: ${plan.athlete.age} y • ${plan.athlete.sex} • ${plan.athlete.weightKg} kg`, 40, y);
  y += 20;

  plan.days.forEach((day) => {
    doc.setFont('helvetica', 'bold');
    doc.text(day.date, 40, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    day.meals.forEach((meal) => {
      doc.text(`${meal.type.toUpperCase()}: ${meal.items.map((item) => item.name).join(', ')}`, 50, y, { maxWidth: 500 });
      y += 14;
      if (meal.notes) {
        doc.setFontSize(10);
        doc.text(`Notes: ${meal.notes}`, 60, y, { maxWidth: 480 });
        doc.setFontSize(12);
        y += 12;
      }
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
    });
    doc.text(`Totals: ${day.totals.kcal} kcal • P ${day.totals.p} g • F ${day.totals.f} g • C ${day.totals.c} g`, 50, y);
    y += 24;
    if (y > 780) {
      doc.addPage();
      y = 40;
    }
  });

  doc.save('elfit-rookie-fuel-plan.pdf');
}

export function exportPlanToCSV(plan: Plan) {
  const rows: Record<string, string | number>[] = [];
  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      rows.push({
        date: day.date,
        meal: meal.type,
        items: meal.items.map((item) => `${item.name} (${item.grams}g)`).join(' | '),
        kcal: meal.items.reduce((acc, item) => acc + item.kcal, 0),
        protein: meal.items.reduce((acc, item) => acc + item.protein, 0),
        fat: meal.items.reduce((acc, item) => acc + item.fat, 0),
        carbs: meal.items.reduce((acc, item) => acc + item.carbs, 0)
      });
    });
  });
  const csv = unparse(rows);
  download(csv, 'elfit-rookie-fuel-plan.csv');
}

export function exportPlanToICS(plan: Plan) {
  const events = plan.days.flatMap((day) => {
    return day.meals
      .filter((meal) => ['pre', 'intra', 'post', 'snack'].includes(meal.type))
      .map((meal) => {
        const [year, month, dayPart] = day.date.split('-').map((part) => parseInt(part, 10));
        const defaultTime = meal.type === 'pre' ? [15, 30] : meal.type === 'post' ? [20, 30] : [12, 0];
        return {
          title: `${meal.type.toUpperCase()} nutrition`,
          start: [year, month, dayPart, defaultTime[0], defaultTime[1]],
          duration: { minutes: 30 },
          description: meal.items.map((item) => item.name).join(', ')
        };
      });
  });

  const { error, value } = createEvents(events);
  if (error) {
    console.error(toError(error));
    return;
  }
  download(value ?? '', 'elfit-rookie-fuel-plan.ics');
}

import { ARABIC_DAYS, ARABIC_MONTHS } from './types';

export const SHIFT_START = '07:30';
export const SHIFT_END = '16:30';
export const BREAK_MINUTES = 60;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function arabicDayName(iso: string): string {
  const date = parseISODate(iso);
  return ARABIC_DAYS[date.getDay()];
}

export function arabicMonthYear(year: number, month: number): string {
  return `${ARABIC_MONTHS[month]} ${year}`;
}

export function currentTimeStr(d: Date = new Date()): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function timeToMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m, s = '0'] = t.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export function minutesToHuman(mins: number): string {
  if (mins <= 0) return '0 د';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
}

export function minutesToClock(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${pad2(h)}:${pad2(m)}`;
}

export function clockToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function morningDelay(entry1: string | null): number {
  if (!entry1) return 0;
  const d = clockToMinutes(entry1) - clockToMinutes(SHIFT_START);
  return Math.max(0, d);
}

export function breakDelay(exit1: string | null, entry2: string | null): number {
  if (!exit1 || !entry2) return 0;
  const expectedReturn = clockToMinutes(exit1) + BREAK_MINUTES;
  const d = clockToMinutes(entry2) - expectedReturn;
  return Math.max(0, d);
}

export function totalDelay(row: {
  entry1: string | null;
  exit1: string | null;
  entry2: string | null;
}): number {
  return morningDelay(row.entry1) + breakDelay(row.exit1, row.entry2);
}

export function workDurationMinutes(row: {
  entry1: string | null;
  exit1: string | null;
  entry2: string | null;
  exit2: string | null;
}): number {
  const morningMinutes = row.entry1 && row.exit1 ? clockToMinutes(row.exit1) - clockToMinutes(row.entry1) : 0;
  const afternoonMinutes = row.entry2 && row.exit2 ? clockToMinutes(row.exit2) - clockToMinutes(row.entry2) : 0;
  return Math.max(0, morningMinutes + afternoonMinutes);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isoForDay(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

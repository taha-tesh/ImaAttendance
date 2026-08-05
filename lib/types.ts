export type Employee = {
  id: string;
  full_name: string;
  starting_date: string; // ISO date yyyy-mm-dd
  created_at: string;
};

export type AttendanceRow = {
  id: string;
  employee_id: string;
  work_date: string; // ISO date yyyy-mm-dd
  entry1: string | null; // HH:MM:SS
  exit1: string | null;
  entry2: string | null;
  exit2: string | null;
  created_at: string;
  updated_at: string;
};

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

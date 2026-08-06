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

export type AssetType = {
  id: string;
  name: string;
  created_at: string;
  available_amount?: string;
};

export type AssetItem = {
  id: string;
  type_id: string;
  name: string;
  quantity: number;
  quantity_in_stock: number;
  available_quantity: number;
  unit_price: string;
  total_price: string;
  created_at: string;
};

export type AssetFund = {
  id: string;
  type_id: string;
  amount: string;
  created_at: string;
};

export type AssetSummary = {
  items: AssetItem[];
  funds: AssetFund[];
  total_item_price: string;
  total_funds: string;
  balance: string;
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

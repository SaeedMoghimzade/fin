
export const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export function toJalali(dateInput: Date | string | number): [number, number, number] {
  const date = new Date(dateInput);
  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);
  
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  
  return [year, month, day];
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = jy + 621;
  let gd = jd;
  const j_day_no = (jy - 979) * 365 + Math.floor((jy - 979) / 33) * 8 + Math.floor(((jy - 979) % 33 + 3) / 4) + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
  let g_day_no = j_day_no + 79;
  gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;
  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no %= 36524;
    if (g_day_no >= 365) g_day_no++;
    else leap = false;
  }
  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;
  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no %= 365;
  }
  let gm = 0;
  const m_days = [31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (gm = 0; gm < 12; gm++) {
    if (g_day_no < m_days[gm]) break;
    g_day_no -= m_days[gm];
  }
  return new Date(gy, gm, g_day_no + 1);
}

export const toJalaliString = (dateInput: string | Date | number): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const getJalaliMonthYear = (dateInput: string | Date | number): string => {
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long'
  }).format(date);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
};

/**
 * Formats a number with thousands separators (1,000,000)
 */
export const formatNumberWithCommas = (value: number | string): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = value.toString().replace(/,/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Parses a string with commas and converts Persian digits to English
 */
export const parseFormattedNumber = (value: string): number => {
  const englishDigits = value
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/,/g, '');
  const num = parseInt(englishDigits, 10);
  return isNaN(num) ? 0 : num;
};

export const addJalaliMonth = (date: string, months: number): string => {
  const [jy, jm, jd] = toJalali(date);
  let targetMonth = jm + months;
  let targetYear = jy + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12) + 1;
  const maxDay = targetMonth <= 6 ? 31 : (targetMonth <= 11 ? 30 : 29);
  const targetDay = Math.min(jd, maxDay);
  return toGregorian(targetYear, targetMonth, targetDay).toISOString();
};

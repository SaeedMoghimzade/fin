
export const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Converts a Gregorian Date or ISO string to Jalali year, month, day.
 * Uses the browser's native Intl.DateTimeFormat for maximum accuracy and compatibility.
 */
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

/**
 * Converts Jalali year, month, day to a Gregorian Date object.
 */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = jy + 621;
  let gd = jd;
  
  // Calculate total days from Jalali epoch
  const j_day_no = (jy - 979) * 365 + Math.floor((jy - 979) / 33) * 8 + Math.floor(((jy - 979) % 33 + 3) / 4) + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
  
  // Convert to Gregorian total days
  let g_day_no = j_day_no + 79;
  
  gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no %= 146097;
  
  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no %= 36524;
    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = false;
    }
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

// Returns standard ISO date for a given Jalali month increment
export const addJalaliMonth = (date: string, months: number): string => {
  const [jy, jm, jd] = toJalali(date);
  
  let targetMonth = jm + months;
  let targetYear = jy + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12) + 1;
  
  // Basic max day logic for Jalali months
  const maxDay = targetMonth <= 6 ? 31 : (targetMonth <= 11 ? 30 : 29);
  const targetDay = Math.min(jd, maxDay);
  
  return toGregorian(targetYear, targetMonth, targetDay).toISOString();
};

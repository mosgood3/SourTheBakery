/**
 * Timezone utilities for Sour The Bakery
 * All dates/times are handled in Eastern Time (America/New_York)
 */

const TIMEZONE = 'America/New_York';

/**
 * Get current date string in EST (YYYY-MM-DD format)
 * Use this instead of: new Date().toISOString().split('T')[0]
 */
export function getTodayEST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Get current Date object adjusted to EST
 * Note: The Date object itself is still in UTC internally,
 * but represents the current moment in EST
 */
export function getNowEST(): Date {
  const nowStr = new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(nowStr);
}

/**
 * Parse a date string (YYYY-MM-DD) as EST midnight
 * Returns a Date object representing midnight EST on that date
 */
export function parseDateEST(dateString: string): Date {
  // Extract just the date part if it includes time
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  // Parse as noon to avoid any DST edge cases, then we compare dates only
  const estString = new Date(dateOnly + 'T12:00:00').toLocaleString('en-US', { timeZone: TIMEZONE });
  return new Date(estString);
}

/**
 * Format a date string for display in EST
 * @param dateString - Date in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormatOptions for formatting
 */
export function formatDateEST(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
): string {
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const date = new Date(dateOnly + 'T12:00:00');
  return date.toLocaleDateString('en-US', { timeZone: TIMEZONE, ...options });
}

/**
 * Format a time string for display in EST
 * @param timeString - Time in HH:MM:SS or HH:MM format
 */
export function formatTimeEST(
  timeString: string,
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
): string {
  // Parse the time string directly without timezone conversion
  // The input time (e.g., "15:00") is already in EST, so we just format it
  const [hours, minutes] = timeString.split(':').map(Number);
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const minuteStr = minutes.toString().padStart(2, '0');
  return `${hour12}:${minuteStr} ${ampm}`;
}

/**
 * Format a timestamp (ISO string or Date) for display in EST
 */
export function formatTimestampEST(
  timestamp: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-US', { timeZone: TIMEZONE, ...options });
}

/**
 * Check if today (EST) is within a date range (inclusive)
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export function isWithinDateRangeEST(startDate: string, endDate: string): boolean {
  const today = getTodayEST();
  const start = startDate.includes('T') ? startDate.split('T')[0] : startDate;
  const end = endDate.includes('T') ? endDate.split('T')[0] : endDate;
  return today >= start && today <= end;
}

/**
 * Check if today (EST) is before a date
 * @param dateString - Date in YYYY-MM-DD format
 */
export function isBeforeDateEST(dateString: string): boolean {
  const today = getTodayEST();
  const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  return today < date;
}

/**
 * Check if today (EST) is after a date
 * @param dateString - Date in YYYY-MM-DD format
 */
export function isAfterDateEST(dateString: string): boolean {
  const today = getTodayEST();
  const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  return today > date;
}

/**
 * Check if today (EST) equals a date
 * @param dateString - Date in YYYY-MM-DD format
 */
export function isTodayEST(dateString: string): boolean {
  const today = getTodayEST();
  const date = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  return today === date;
}

/**
 * Get the current EST datetime as an ISO string
 * Useful for database timestamps that should reflect EST time
 */
export function getISOStringEST(): string {
  return new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
}

/**
 * Compare two date strings (returns -1, 0, or 1)
 */
export function compareDatesEST(date1: string, date2: string): number {
  const d1 = date1.includes('T') ? date1.split('T')[0] : date1;
  const d2 = date2.includes('T') ? date2.split('T')[0] : date2;
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

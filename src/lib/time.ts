// Current time for server components. They render once per request, so
// reading the clock here is safe even though render-time Date.now() is not.
export function requestTime(): number {
  return Date.now()
}

/** Calendar date (YYYY-MM-DD) at the school, in WIB. */
export function schoolDate(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(ms)
}

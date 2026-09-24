// Current time for server components. They render once per request, so
// reading the clock here is safe even though render-time Date.now() is not.
export function requestTime(): number {
  return Date.now()
}

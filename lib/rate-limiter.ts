const rateLimits = new Map<string, number[]>();

/**
 * Checks if a request from the given IP address is within the rate limit.
 * Defaults to 5 requests per 1 minute (60000ms).
 */
export function checkRateLimit(ip: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(ip) || [];

  // Keep only timestamps within the current window
  const activeTimestamps = timestamps.filter(t => now - t < windowMs);

  if (activeTimestamps.length >= maxRequests) {
    return false;
  }

  activeTimestamps.push(now);
  rateLimits.set(ip, activeTimestamps);

  // Periodic cleanup of the Map to avoid memory leak
  if (rateLimits.size > 1000) {
    for (const [key, val] of rateLimits.entries()) {
      const cleanVal = val.filter(t => now - t < windowMs);
      if (cleanVal.length === 0) {
        rateLimits.delete(key);
      } else {
        rateLimits.set(key, cleanVal);
      }
    }
  }

  return true;
}

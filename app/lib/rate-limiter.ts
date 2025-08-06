import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  requests: number[];
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
  blockDuration?: number; // in milliseconds, defaults to window
}

export function rateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const { requests: maxRequests, window, blockDuration = window } = config;
  
  let entry = rateLimitMap.get(identifier);
  
  if (!entry) {
    entry = { requests: [], blocked: false };
    rateLimitMap.set(identifier, entry);
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    return false;
  }

  // Remove blocked status if block period has expired
  if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
    entry.blocked = false;
    entry.blockUntil = undefined;
    entry.requests = [];
  }

  // Remove old requests outside the window
  entry.requests = entry.requests.filter(timestamp => now - timestamp < window);

  // Check if rate limit exceeded
  if (entry.requests.length >= maxRequests) {
    entry.blocked = true;
    entry.blockUntil = now + blockDuration;
    return false;
  }

  // Add current request
  entry.requests.push(now);
  return true;
}

export function createRateLimitedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Use IP address as identifier, fallback to a default for localhost
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';

    if (!rateLimit(identifier, config)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.blockDuration || config.window / 1000).toString()
          }
        }
      );
    }

    return handler(request);
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    // Remove entries that haven't been used in the last hour
    const lastRequest = entry.requests[entry.requests.length - 1] || 0;
    if (now - lastRequest > 3600000) { // 1 hour
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Run cleanup every 5 minutes
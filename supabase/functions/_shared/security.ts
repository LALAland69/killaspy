/**
 * SECURITY: Edge Function Security Utilities
 * Rate limiting, request validation, and security headers for Deno edge functions
 */

// ============= CORS HEADERS WITH SECURITY =============

export const securityHeaders = {
  // SECURITY: Restrict CORS in production
  "Access-Control-Allow-Origin": "*", // Configure per environment
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  
  // SECURITY: Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // SECURITY: Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // SECURITY: XSS protection (legacy but still useful)
  "X-XSS-Protection": "1; mode=block",
  
  // SECURITY: Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // SECURITY: Content Security Policy (adjust per function needs)
  "Content-Security-Policy": "default-src 'self'; script-src 'none'; object-src 'none'",
};

// ============= RATE LIMITING =============

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory store (use Redis/KV in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * SECURITY: Rate limit middleware for edge functions
 * Prevents flood/DoS attacks
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const key = `rate:${identifier}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

/**
 * SECURITY: Get client IP from request
 */
export function getClientIp(req: Request): string {
  // Check common proxy headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Cloudflare header
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return "unknown";
}

// ============= BOT DETECTION =============

/**
 * SECURITY: Basic bot detection
 * Returns true if request appears to be from a bot
 */
export function detectBot(req: Request): { isBot: boolean; reason?: string } {
  const userAgent = req.headers.get("user-agent") || "";
  
  // SECURITY: Known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /puppeteer/i,
    /playwright/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /axios/i,
    /node-fetch/i,
  ];
  
  // SECURITY: Known vulnerability scanners
  const scannerPatterns = [
    /nikto/i,
    /sqlmap/i,
    /nmap/i,
    /masscan/i,
    /acunetix/i,
    /nessus/i,
    /burp/i,
    /zaproxy/i,
    /dirbuster/i,
    /gobuster/i,
  ];
  
  for (const pattern of scannerPatterns) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: "vulnerability_scanner" };
    }
  }
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return { isBot: true, reason: "bot_user_agent" };
    }
  }
  
  // SECURITY: Empty or suspiciously short user agent
  if (userAgent.length < 10) {
    return { isBot: true, reason: "suspicious_user_agent" };
  }
  
  return { isBot: false };
}

// ============= INPUT VALIDATION =============

/**
 * SECURITY: Validate UUID format
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * SECURITY: Validate and sanitize string input
 */
export function sanitizeString(
  value: unknown,
  maxLength: number = 1000
): string {
  if (typeof value !== "string") return "";
  
  return value
    .substring(0, maxLength)
    .replace(/[<>'"`;\\]/g, "") // Remove dangerous chars
    .trim();
}

/**
 * SECURITY: Validate integer within bounds
 */
export function validateInt(
  value: unknown,
  min: number = 0,
  max: number = 10000
): number {
  const num = typeof value === "number" ? value : parseInt(String(value), 10);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
}

// ============= SSRF PREVENTION =============

/**
 * SECURITY: Validate URL to prevent SSRF attacks
 */
export function isValidExternalUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // SECURITY: Only allow HTTP/HTTPS
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "Only HTTP/HTTPS protocols allowed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // SECURITY: Block localhost
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return { valid: false, error: "Localhost not allowed" };
    }
    
    // SECURITY: Block private IP ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 10) return { valid: false, error: "Private IP not allowed" };
      if (a === 172 && b >= 16 && b <= 31) return { valid: false, error: "Private IP not allowed" };
      if (a === 192 && b === 168) return { valid: false, error: "Private IP not allowed" };
      if (a === 169 && b === 254) return { valid: false, error: "Link-local IP not allowed" };
      if (a === 127) return { valid: false, error: "Loopback not allowed" };
      if (a === 0) return { valid: false, error: "Invalid IP" };
    }
    
    // SECURITY: Block internal hostnames
    const blockedPatterns = [
      /\.local$/,
      /\.internal$/,
      /\.corp$/,
      /\.lan$/,
      /^metadata\.google\.internal$/,
      /^instance-data$/,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, error: "Internal hostname not allowed" };
      }
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// ============= ERROR HANDLING =============

/**
 * SECURITY: Create safe error response
 * Never expose internal details to clients
 */
export function safeErrorResponse(
  error: unknown,
  statusCode: number = 500
): Response {
  // SECURITY: Log full error server-side
  console.error("[ERROR]", error);
  
  // SECURITY: Return generic message to client
  const safeMessage = statusCode === 400
    ? "Invalid request"
    : statusCode === 401
    ? "Authentication required"
    : statusCode === 403
    ? "Access denied"
    : statusCode === 404
    ? "Not found"
    : statusCode === 429
    ? "Too many requests"
    : "An error occurred";
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: safeMessage,
      // SECURITY: Only include error code, not details
      code: `ERR_${statusCode}`,
    }),
    {
      status: statusCode,
      headers: {
        ...securityHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

// ============= SECURITY LOGGING =============

interface SecurityLog {
  timestamp: string;
  type: string;
  ip: string;
  endpoint: string;
  details?: Record<string, unknown>;
}

/**
 * SECURITY: Log security events
 */
export function logSecurityEvent(
  type: string,
  req: Request,
  details?: Record<string, unknown>
): void {
  const log: SecurityLog = {
    timestamp: new Date().toISOString(),
    type,
    ip: getClientIp(req),
    endpoint: new URL(req.url).pathname,
    details,
  };
  
  console.warn(`[SECURITY] ${JSON.stringify(log)}`);
}

// ============= REQUEST VALIDATION MIDDLEWARE =============

interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * SECURITY: Validate incoming request
 * Call this at the start of every edge function
 */
export function validateRequest(
  req: Request,
  options: {
    requireAuth?: boolean;
    rateLimit?: RateLimitConfig;
    allowedMethods?: string[];
    blockBots?: boolean;
  } = {}
): ValidationResult {
  const {
    requireAuth = false,
    rateLimit: rateLimitConfig,
    allowedMethods = ["GET", "POST", "OPTIONS"],
    blockBots = false,
  } = options;
  
  // SECURITY: Check HTTP method
  if (!allowedMethods.includes(req.method)) {
    return { valid: false, error: "Method not allowed", statusCode: 405 };
  }
  
  // SECURITY: Bot detection
  if (blockBots) {
    const botCheck = detectBot(req);
    if (botCheck.isBot) {
      logSecurityEvent("BOT_BLOCKED", req, { reason: botCheck.reason });
      return { valid: false, error: "Access denied", statusCode: 403 };
    }
  }
  
  // SECURITY: Rate limiting
  if (rateLimitConfig) {
    const ip = getClientIp(req);
    const rateLimitResult = rateLimit(ip, rateLimitConfig);
    if (!rateLimitResult.allowed) {
      logSecurityEvent("RATE_LIMITED", req);
      return { valid: false, error: "Too many requests", statusCode: 429 };
    }
  }
  
  // SECURITY: Authentication check
  if (requireAuth) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { valid: false, error: "Authentication required", statusCode: 401 };
    }
  }
  
  return { valid: true };
}

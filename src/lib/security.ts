/**
 * SECURITY: Comprehensive input validation and sanitization utilities
 * Implements defense-in-depth against injection attacks
 */

import { z } from "zod";

// ============= XSS PREVENTION =============

// SECURITY: HTML entities encoding to prevent XSS
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * SECURITY: Escape HTML special characters to prevent XSS
 * Use this before rendering any user-provided content
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * SECURITY: Strip all HTML tags from string
 * Use when you need plain text only
 */
export function stripHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * SECURITY: Sanitize string for use in URLs
 * Prevents javascript: and data: protocol injection
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") return "";
  
  const trimmed = url.trim().toLowerCase();
  
  // SECURITY: Block dangerous protocols
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "about:",
  ];
  
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`[SECURITY] Blocked dangerous URL protocol: ${protocol}`);
      return "";
    }
  }
  
  return url;
}

// ============= INPUT VALIDATION SCHEMAS =============

/**
 * SECURITY: Common validation schemas using Zod
 * These prevent SQL injection by ensuring type safety
 */

// UUID validation (prevents SQL injection in ID fields)
export const uuidSchema = z
  .string()
  .uuid({ message: "Invalid ID format" })
  .transform((val) => val.toLowerCase());

// Email validation with sanitization
export const emailSchema = z
  .string()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email too long" })
  .transform((val) => val.toLowerCase().trim());

// Safe string with length limits (prevents buffer overflow)
export const safeStringSchema = (maxLength: number = 1000) =>
  z
    .string()
    .max(maxLength, { message: `Text too long (max ${maxLength} chars)` })
    .transform((val) => val.trim());

// Search query - sanitized for database use
export const searchQuerySchema = z
  .string()
  .max(200, { message: "Search query too long" })
  .transform((val) => {
    // SECURITY: Remove SQL injection patterns
    return val
      .trim()
      .replace(/['"`;\\]/g, "") // Remove quotes and escape chars
      .replace(/--/g, "") // Remove SQL comments
      .replace(/\/\*/g, "") // Remove block comments
      .substring(0, 200);
  });

// Positive integer (for limits, page numbers)
export const positiveIntSchema = z
  .number()
  .int()
  .positive()
  .max(10000, { message: "Number too large" });

// Country code validation
export const countryCodeSchema = z
  .string()
  .length(2, { message: "Country code must be 2 characters" })
  .regex(/^[A-Z]{2}$/, { message: "Invalid country code format" })
  .transform((val) => val.toUpperCase());

// URL validation with security checks
export const safeUrlSchema = z
  .string()
  .url({ message: "Invalid URL format" })
  .max(2048, { message: "URL too long" })
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // SECURITY: Only allow http/https
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Only HTTP/HTTPS URLs allowed" }
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        // SECURITY: Block localhost and private IPs
        return !(
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          hostname.startsWith("172.") ||
          hostname.endsWith(".local")
        );
      } catch {
        return false;
      }
    },
    { message: "Internal URLs not allowed" }
  );

// ============= FORM VALIDATION =============

/**
 * SECURITY: Login form validation schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password too long" }),
});

/**
 * SECURITY: Search form validation schema
 */
export const searchFormSchema = z.object({
  query: searchQuerySchema,
  category: z.string().optional(),
  country: countryCodeSchema.optional(),
  limit: positiveIntSchema.optional().default(50),
});

/**
 * SECURITY: Import schedule validation schema
 */
export const importScheduleSchema = z.object({
  name: safeStringSchema(100),
  search_terms: searchQuerySchema.optional(),
  search_page_ids: z.array(z.string().max(50)).max(10).optional(),
  ad_reached_countries: z.array(countryCodeSchema).max(20).optional(),
  ad_active_status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional(),
  import_limit: positiveIntSchema.max(500).optional(),
});

// ============= SUSPICIOUS INPUT DETECTION =============

/**
 * SECURITY: Detect potential SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  if (typeof input !== "string") return false;
  
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i, // OR 1=1, AND 1=1
    /(--|\/\*|\*\/|;)/,              // SQL comments
    /('|")\s*(OR|AND)/i,              // Quote followed by OR/AND
    /(\bCONCAT\b|\bCHAR\b|\bCHR\b)/i, // Common SQL functions
  ];
  
  return patterns.some((pattern) => pattern.test(input));
}

/**
 * SECURITY: Detect potential XSS attempts
 */
export function detectXssAttempt(input: string): boolean {
  if (typeof input !== "string") return false;
  
  const patterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,    // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /expression\s*\(/i, // CSS expression
    /eval\s*\(/i,
    /document\.(cookie|location|write)/i,
  ];
  
  return patterns.some((pattern) => pattern.test(input));
}

/**
 * SECURITY: Detect path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  if (typeof input !== "string") return false;
  
  const patterns = [
    /\.\.\//,         // ../
    /\.\.\\>/,        // ..\
    /%2e%2e/i,        // URL encoded ..
    /%252e%252e/i,    // Double URL encoded
    /\.\.%2f/i,       // Mixed encoding
  ];
  
  return patterns.some((pattern) => pattern.test(input));
}

/**
 * SECURITY: Comprehensive input security check
 * Returns object with detection results and sanitized value
 */
export function securityCheck(input: string): {
  original: string;
  sanitized: string;
  threats: string[];
  isSafe: boolean;
} {
  const threats: string[] = [];
  
  if (detectSqlInjection(input)) {
    threats.push("SQL_INJECTION");
  }
  if (detectXssAttempt(input)) {
    threats.push("XSS");
  }
  if (detectPathTraversal(input)) {
    threats.push("PATH_TRAVERSAL");
  }
  
  return {
    original: input,
    sanitized: escapeHtml(stripHtml(input)),
    threats,
    isSafe: threats.length === 0,
  };
}

// ============= PASSWORD SECURITY =============

/**
 * SECURITY: Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");
  
  if (password.length >= 12) score++;
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push("Mix uppercase and lowercase letters");
  
  if (/\d/.test(password)) score++;
  else feedback.push("Add numbers");
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push("Add special characters");
  
  // SECURITY: Check for common weak passwords
  const weakPasswords = [
    "password", "123456", "12345678", "qwerty", "abc123",
    "password123", "admin", "letmein", "welcome", "monkey",
  ];
  
  if (weakPasswords.some((weak) => password.toLowerCase().includes(weak))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common passwords");
  }
  
  return { score: Math.min(4, score), feedback };
}

// ============= RATE LIMITING HELPERS =============

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * SECURITY: Simple in-memory rate limiter
 * For production, use Redis or similar
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now };
}

// ============= SECURITY LOGGING =============

export interface SecurityEvent {
  type: "SQL_INJECTION" | "XSS" | "PATH_TRAVERSAL" | "RATE_LIMIT" | "AUTH_FAILURE" | "SUSPICIOUS";
  timestamp: string;
  ip?: string;
  userId?: string;
  input?: string;
  endpoint?: string;
  details?: Record<string, unknown>;
}

const securityLog: SecurityEvent[] = [];

/**
 * SECURITY: Log security events for monitoring
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    input: event.input ? event.input.substring(0, 500) : undefined, // Truncate long inputs
  };
  
  securityLog.push(fullEvent);
  
  // Keep only last 1000 events in memory
  if (securityLog.length > 1000) {
    securityLog.shift();
  }
  
  // Log to console with warning level
  console.warn(`[SECURITY] ${event.type}:`, fullEvent);
}

/**
 * Get recent security events
 */
export function getSecurityEvents(limit: number = 100): SecurityEvent[] {
  return securityLog.slice(-limit);
}

export { z };

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the security utility functions
describe('Security Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchQuerySchema', () => {
    it('validates normal search strings', async () => {
      const { searchQuerySchema } = await import('@/lib/security');
      
      const result = searchQuerySchema.safeParse('normal search');
      expect(result.success).toBe(true);
    });

    it('rejects strings that are too long', async () => {
      const { searchQuerySchema } = await import('@/lib/security');
      
      const longString = 'a'.repeat(201);
      const result = searchQuerySchema.safeParse(longString);
      expect(result.success).toBe(false);
    });

    it('removes SQL injection patterns', async () => {
      const { searchQuerySchema } = await import('@/lib/security');
      
      const result = searchQuerySchema.safeParse("test'; DROP TABLE--");
      if (result.success) {
        expect(result.data).not.toContain("'");
        expect(result.data).not.toContain('--');
      }
    });

    it('handles empty strings', async () => {
      const { searchQuerySchema } = await import('@/lib/security');
      
      const result = searchQuerySchema.safeParse('');
      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML special characters', async () => {
      const { escapeHtml } = await import('@/lib/security');
      
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('handles null-like inputs', async () => {
      const { escapeHtml } = await import('@/lib/security');
      
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
    });

    it('preserves normal text', async () => {
      const { escapeHtml } = await import('@/lib/security');
      
      const input = 'Normal text with numbers 123';
      const result = escapeHtml(input);
      
      expect(result).toBe(input);
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags', async () => {
      const { stripHtml } = await import('@/lib/security');
      
      const input = '<div>Hello <b>World</b></div>';
      const result = stripHtml(input);
      
      expect(result).toBe('Hello World');
    });

    it('handles empty input', async () => {
      const { stripHtml } = await import('@/lib/security');
      
      expect(stripHtml('')).toBe('');
    });
  });

  describe('detectSqlInjection', () => {
    it('detects SELECT statements', async () => {
      const { detectSqlInjection } = await import('@/lib/security');
      
      expect(detectSqlInjection("'; SELECT * FROM users --")).toBe(true);
    });

    it('detects OR 1=1 patterns', async () => {
      const { detectSqlInjection } = await import('@/lib/security');
      
      expect(detectSqlInjection("' OR 1=1")).toBe(true);
    });

    it('allows safe input', async () => {
      const { detectSqlInjection } = await import('@/lib/security');
      
      expect(detectSqlInjection('normal search query')).toBe(false);
    });
  });

  describe('detectXssAttempt', () => {
    it('detects script tags', async () => {
      const { detectXssAttempt } = await import('@/lib/security');
      
      expect(detectXssAttempt('<script>alert(1)</script>')).toBe(true);
    });

    it('detects javascript: protocol', async () => {
      const { detectXssAttempt } = await import('@/lib/security');
      
      expect(detectXssAttempt('javascript:void(0)')).toBe(true);
    });

    it('detects event handlers', async () => {
      const { detectXssAttempt } = await import('@/lib/security');
      
      expect(detectXssAttempt('onclick=alert(1)')).toBe(true);
    });

    it('allows safe input', async () => {
      const { detectXssAttempt } = await import('@/lib/security');
      
      expect(detectXssAttempt('normal text content')).toBe(false);
    });
  });

  describe('securityCheck', () => {
    it('returns safe for clean input', async () => {
      const { securityCheck } = await import('@/lib/security');
      
      const result = securityCheck('Hello World');
      
      expect(result.isSafe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('detects multiple threats', async () => {
      const { securityCheck } = await import('@/lib/security');
      
      const result = securityCheck("<script>'; SELECT * FROM users</script>");
      
      expect(result.isSafe).toBe(false);
      expect(result.threats).toContain('SQL_INJECTION');
      expect(result.threats).toContain('XSS');
    });

    it('provides sanitized version', async () => {
      const { securityCheck } = await import('@/lib/security');
      
      const result = securityCheck('<b>Bold</b>');
      
      expect(result.sanitized).not.toContain('<b>');
    });
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', async () => {
      const { checkRateLimit } = await import('@/lib/security');
      
      const result = checkRateLimit('test-key-1', 10, 60000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('blocks requests over limit', async () => {
      const { checkRateLimit } = await import('@/lib/security');
      
      // Use unique key to avoid interference
      const key = 'test-key-limit-' + Date.now();
      
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit(key, 10, 60000);
      }
      
      // 11th should be blocked
      const result = checkRateLimit(key, 10, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('uuidSchema', () => {
    it('validates correct UUIDs', async () => {
      const { uuidSchema } = await import('@/lib/security');
      
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const result = uuidSchema.safeParse(validUUID);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUIDs', async () => {
      const { uuidSchema } = await import('@/lib/security');
      
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('550e8400-e29b-41d4').success).toBe(false);
      expect(uuidSchema.safeParse('').success).toBe(false);
    });

    it('rejects SQL injection attempts', async () => {
      const { uuidSchema } = await import('@/lib/security');
      
      const malicious = "'; DROP TABLE users; --";
      expect(uuidSchema.safeParse(malicious).success).toBe(false);
    });
  });
});

/**
 * SECURITY: React hook for secure form handling
 * Implements client-side validation with security checks
 */

import { useState, useCallback } from "react";
import {
  securityCheck,
  logSecurityEvent,
  checkRateLimit,
} from "@/lib/security";
import { z, ZodSchema } from "zod";
import { toast } from "sonner";

interface UseSecureFormOptions<T extends ZodSchema> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  rateLimitKey?: string;
  maxSubmissions?: number;
  windowMs?: number;
}

interface SecureFormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  securityWarnings: string[];
}

/**
 * SECURITY: Secure form hook with validation and rate limiting
 */
export function useSecureForm<T extends ZodSchema>({
  schema,
  onSubmit,
  rateLimitKey = "form_submit",
  maxSubmissions = 5,
  windowMs = 60000,
}: UseSecureFormOptions<T>) {
  const [state, setState] = useState<SecureFormState>({
    isSubmitting: false,
    errors: {},
    securityWarnings: [],
  });

  const validateField = useCallback(
    (name: string, value: unknown): string | null => {
      // SECURITY: Check for injection attempts
      if (typeof value === "string") {
        const check = securityCheck(value);
        if (!check.isSafe) {
          logSecurityEvent({
            type: "SUSPICIOUS",
            input: value.substring(0, 200),
            details: { field: name, threats: check.threats },
          });
          return "Invalid input detected";
        }
      }

      // Validate with schema
      try {
        const fieldSchema = (schema as any).shape?.[name];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
        return null;
      } catch (err) {
        if (err instanceof z.ZodError) {
          return err.errors[0]?.message || "Invalid value";
        }
        return "Validation error";
      }
    },
    [schema]
  );

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      // SECURITY: Rate limiting
      const rateLimitResult = checkRateLimit(rateLimitKey, maxSubmissions, windowMs);
      if (!rateLimitResult.allowed) {
        logSecurityEvent({
          type: "RATE_LIMIT",
          details: { key: rateLimitKey },
        });
        toast.error("Muitas tentativas. Aguarde um momento.");
        return;
      }

      setState((prev) => ({ ...prev, isSubmitting: true, errors: {}, securityWarnings: [] }));

      const errors: Record<string, string> = {};
      const warnings: string[] = [];

      // SECURITY: Validate all fields
      for (const [key, value] of Object.entries(data)) {
        // Security check
        if (typeof value === "string") {
          const check = securityCheck(value);
          if (!check.isSafe) {
            errors[key] = "Input inválido detectado";
            warnings.push(`Campo ${key}: ${check.threats.join(", ")}`);
          }
        }
      }

      // Schema validation
      try {
        const validatedData = schema.parse(data);

        if (Object.keys(errors).length === 0) {
          await onSubmit(validatedData);
        } else {
          // Log security warnings
          if (warnings.length > 0) {
            console.warn("[SECURITY] Form submission blocked:", warnings);
          }
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          for (const issue of err.errors) {
            const path = issue.path.join(".");
            errors[path] = issue.message;
          }
        } else {
          throw err;
        }
      } finally {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          errors,
          securityWarnings: warnings,
        }));
      }
    },
    [schema, onSubmit, rateLimitKey, maxSubmissions, windowMs]
  );

  return {
    ...state,
    validateField,
    handleSubmit,
    clearErrors: () => setState((prev) => ({ ...prev, errors: {}, securityWarnings: [] })),
  };
}

/**
 * SECURITY: Hook for monitoring suspicious user behavior
 */
export function useSecurityMonitor() {
  const trackAction = useCallback((action: string, details?: Record<string, unknown>) => {
    // Track rapid sequential actions (potential automation)
    const key = `action:${action}`;
    const result = checkRateLimit(key, 30, 10000); // 30 actions per 10 seconds
    
    if (!result.allowed) {
      logSecurityEvent({
        type: "SUSPICIOUS",
        details: { action, ...details, reason: "rapid_actions" },
      });
      console.warn(`[SECURITY] Rapid actions detected: ${action}`);
    }
  }, []);

  const trackNavigation = useCallback((from: string, to: string) => {
    // Track rapid navigation (potential enumeration)
    const key = "navigation";
    const result = checkRateLimit(key, 50, 30000); // 50 navigations per 30 seconds
    
    if (!result.allowed) {
      logSecurityEvent({
        type: "SUSPICIOUS",
        details: { from, to, reason: "rapid_navigation" },
      });
    }
  }, []);

  const trackIdAccess = useCallback((resourceType: string, id: string) => {
    // Track sequential ID access (potential IDOR enumeration)
    const key = `id_access:${resourceType}`;
    const result = checkRateLimit(key, 20, 60000); // 20 ID accesses per minute
    
    if (!result.allowed) {
      logSecurityEvent({
        type: "SUSPICIOUS",
        details: { resourceType, id, reason: "potential_idor" },
      });
      console.warn(`[SECURITY] Potential IDOR enumeration: ${resourceType}`);
    }
  }, []);

  return {
    trackAction,
    trackNavigation,
    trackIdAccess,
  };
}

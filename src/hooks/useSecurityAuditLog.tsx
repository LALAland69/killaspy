import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type SecuritySeverity = 'info' | 'warning' | 'critical';

interface LogSecurityEventParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  severity?: SecuritySeverity;
  metadata?: Record<string, unknown>;
}

/**
 * Hook para logging de eventos de segurança
 * Registra ações sensíveis para auditoria
 */
export function useSecurityAuditLog() {
  const { user } = useAuth();

  const logEvent = useCallback(async ({
    action,
    resourceType,
    resourceId,
    severity = 'info',
    metadata = {}
  }: LogSecurityEventParams): Promise<string | null> => {
    if (!user) {
      console.warn('[SecurityAudit] Cannot log event: user not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _severity: severity,
        _metadata: JSON.parse(JSON.stringify(metadata))
      });

      if (error) {
        console.error('[SecurityAudit] Failed to log event:', error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('[SecurityAudit] Exception logging event:', err);
      return null;
    }
  }, [user]);

  // Helpers para eventos comuns
  const logLogin = useCallback(() => 
    logEvent({ 
      action: 'login', 
      resourceType: 'auth',
      severity: 'info' 
    }), [logEvent]);

  const logLogout = useCallback(() => 
    logEvent({ 
      action: 'logout', 
      resourceType: 'auth',
      severity: 'info' 
    }), [logEvent]);

  const logDataExport = useCallback((resourceType: string, count: number) => 
    logEvent({ 
      action: 'data_export', 
      resourceType,
      severity: 'warning',
      metadata: { exported_count: count }
    }), [logEvent]);

  const logBulkDelete = useCallback((resourceType: string, ids: string[]) => 
    logEvent({ 
      action: 'bulk_delete', 
      resourceType,
      severity: 'warning',
      metadata: { deleted_ids: ids, count: ids.length }
    }), [logEvent]);

  const logSecurityAuditRun = useCallback((auditId: string, targetUrl: string) => 
    logEvent({ 
      action: 'security_audit_run', 
      resourceType: 'security_audit',
      resourceId: auditId,
      severity: 'info',
      metadata: { target_url: targetUrl }
    }), [logEvent]);

  const logSuspiciousActivity = useCallback((details: Record<string, unknown>) => 
    logEvent({ 
      action: 'suspicious_activity', 
      resourceType: 'security',
      severity: 'critical',
      metadata: details
    }), [logEvent]);

  return {
    logEvent,
    logLogin,
    logLogout,
    logDataExport,
    logBulkDelete,
    logSecurityAuditRun,
    logSuspiciousActivity
  };
}

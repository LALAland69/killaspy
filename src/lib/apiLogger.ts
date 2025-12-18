// Automatic API call logging wrapper
import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Wrap Supabase query with automatic logging
export async function loggedQuery<T>(
  queryName: string,
  queryFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  metadata?: Record<string, any>
): Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>> {
  const startTime = performance.now();
  
  try {
    logger.debug('API', `Starting query: ${queryName}`, metadata);
    const result = await queryFn();
    const duration = Math.round(performance.now() - startTime);
    
    if (result.error) {
      logger.apiCall(queryName, 'SELECT', 400, duration, result.error.message);
      return result;
    }
    
    const count = Array.isArray(result.data) ? result.data.length : 1;
    logger.apiCall(queryName, 'SELECT', 200, duration);
    logger.debug('API', `Query completed: ${queryName}`, { 
      duration: `${duration}ms`, 
      resultCount: count,
      ...metadata 
    });
    
    return result;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiCall(queryName, 'SELECT', 500, duration, error.message);
    throw error;
  }
}

// Wrap Edge Function calls with automatic logging
export async function loggedEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>,
  options?: { method?: string }
): Promise<{ data: T | null; error: any }> {
  const startTime = performance.now();
  const method = options?.method || 'POST';
  
  logger.info('EDGE_FN', `Calling: ${functionName}`, { 
    body: body ? JSON.stringify(body).substring(0, 200) : undefined 
  });
  
  try {
    const result = await supabase.functions.invoke(functionName, { body });
    const duration = Math.round(performance.now() - startTime);
    
    if (result.error) {
      logger.apiCall(`edge/${functionName}`, method, 400, duration, result.error.message);
      logger.error('EDGE_FN', `Error in ${functionName}`, { 
        error: result.error.message,
        duration: `${duration}ms`
      });
    } else {
      logger.apiCall(`edge/${functionName}`, method, 200, duration);
      logger.info('EDGE_FN', `Success: ${functionName}`, { 
        duration: `${duration}ms`,
        hasData: !!result.data 
      });
    }
    
    return result;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiCall(`edge/${functionName}`, method, 500, duration, error.message);
    logger.error('EDGE_FN', `Exception in ${functionName}`, { 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
}

// Wrap mutations (INSERT, UPDATE, DELETE) with logging
export async function loggedMutation<T>(
  operationName: string,
  method: 'INSERT' | 'UPDATE' | 'DELETE',
  mutationFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  metadata?: Record<string, any>
): Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>> {
  const startTime = performance.now();
  
  logger.info('API', `Starting ${method}: ${operationName}`, metadata);
  
  try {
    const result = await mutationFn();
    const duration = Math.round(performance.now() - startTime);
    
    if (result.error) {
      logger.apiCall(operationName, method, 400, duration, result.error.message);
      logger.error('API', `${method} failed: ${operationName}`, { 
        error: result.error.message,
        ...metadata 
      });
      return result;
    }
    
    logger.apiCall(operationName, method, 200, duration);
    logger.info('API', `${method} completed: ${operationName}`, { 
      duration: `${duration}ms`,
      ...metadata 
    });
    
    return result;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    logger.apiCall(operationName, method, 500, duration, error.message);
    logger.error('API', `${method} exception: ${operationName}`, { 
      error: error.message,
      stack: error.stack,
      ...metadata 
    });
    throw error;
  }
}

// Log user actions
export function logAction(action: string, details?: Record<string, any>) {
  logger.info('ACTION', action, details);
}

// Log navigation
export function logNavigation(from: string, to: string) {
  logger.navigate(from, to);
}

// Initialize auth event logging
export function initAuthLogging() {
  supabase.auth.onAuthStateChange((event, session) => {
    logger.auth(event, !!session, { 
      userId: session?.user?.id,
      email: session?.user?.email 
    });
  });
  
  logger.info('SYSTEM', 'Auth logging initialized');
}

// Log app initialization
export function logAppInit() {
  logger.info('SYSTEM', 'Application initialized', {
    url: window.location.href,
    userAgent: navigator.userAgent.substring(0, 100),
    timestamp: new Date().toISOString()
  });
}

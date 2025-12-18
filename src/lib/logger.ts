// Comprehensive logging system for KillaSpy
import { toast } from "sonner";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

const MAX_LOGS = 1000;
const STORAGE_KEY = 'killaspy_logs';

// Error notification settings
let errorNotificationsEnabled = true;

export function setErrorNotifications(enabled: boolean) {
  errorNotificationsEnabled = enabled;
}

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.setupGlobalErrorHandlers();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load logs from storage');
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent logs
      const logsToSave = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (e) {
      console.warn('Failed to save logs to storage');
    }
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('GLOBAL', 'Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('GLOBAL', 'Unhandled promise rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  private createEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    if (level === 'error' && data?.stack) {
      entry.stack = data.stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }

    this.saveToStorage();
    this.notifyListeners();

    // Show toast notification for errors and warnings
    if (errorNotificationsEnabled) {
      if (entry.level === 'error') {
        toast.error(`[${entry.category}] ${entry.message}`, {
          description: entry.data?.error || undefined,
          duration: 5000,
        });
      } else if (entry.level === 'warn') {
        toast.warning(`[${entry.category}] ${entry.message}`, {
          duration: 3000,
        });
      }
    }

    // Also log to console in development
    const consoleMethod = entry.level === 'error' ? 'error' : 
                          entry.level === 'warn' ? 'warn' : 
                          entry.level === 'debug' ? 'debug' : 'log';
    console[consoleMethod](`[${entry.category}] ${entry.message}`, entry.data || '');
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  debug(category: string, message: string, data?: any) {
    this.addLog(this.createEntry('debug', category, message, data));
  }

  info(category: string, message: string, data?: any) {
    this.addLog(this.createEntry('info', category, message, data));
  }

  warn(category: string, message: string, data?: any) {
    this.addLog(this.createEntry('warn', category, message, data));
  }

  error(category: string, message: string, data?: any) {
    this.addLog(this.createEntry('error', category, message, data));
  }

  // API call logging helper
  apiCall(endpoint: string, method: string, status: number, duration: number, error?: string) {
    const level: LogLevel = status >= 400 ? 'error' : 'info';
    this.addLog(this.createEntry(level, 'API', `${method} ${endpoint}`, {
      status,
      duration: `${duration}ms`,
      error,
    }));
  }

  // Auth event logging
  auth(action: string, success: boolean, details?: any) {
    const level: LogLevel = success ? 'info' : 'error';
    this.addLog(this.createEntry(level, 'AUTH', action, { success, ...details }));
  }

  // Navigation logging
  navigate(from: string, to: string) {
    this.info('NAV', `Navigation: ${from} → ${to}`);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs filtered by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get logs filtered by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Subscribe to log changes
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Export logs as CSV
  exportLogsCSV(): string {
    const headers = ['timestamp', 'level', 'category', 'message', 'data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.category,
      log.message,
      JSON.stringify(log.data || ''),
    ]);
    return [headers.join(','), ...rows.map(r => r.map(c => `\"${c}\"`).join(','))].join('\n');
  }
}

// Singleton instance
export const logger = new Logger();

// Hook for React components
import { useState, useEffect } from 'react';

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());

  useEffect(() => {
    return logger.subscribe(setLogs);
  }, []);

  return {
    logs,
    clearLogs: () => logger.clearLogs(),
    exportJSON: () => logger.exportLogs(),
    exportCSV: () => logger.exportLogsCSV(),
  };
}

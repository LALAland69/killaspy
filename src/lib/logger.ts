/**
 * Comprehensive logging system for KillaSpy
 * 
 * REFATORAÇÃO: ID generation mais seguro usando crypto API
 */
import { toast } from "sonner";
import { SECURITY } from "./constants";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  stack?: string;
}

const MAX_LOGS = SECURITY.MAX_LOG_ENTRIES;
const STORAGE_KEY = "killaspy_logs";

// Error notification settings
let errorNotificationsEnabled = true;

export function setErrorNotifications(enabled: boolean) {
  errorNotificationsEnabled = enabled;
}

/**
 * REFATORAÇÃO: Geração de ID mais segura
 * Usa crypto.randomUUID quando disponível, fallback para timestamp + random
 */
function generateLogId(): string {
  // Usa crypto API se disponível (mais seguro)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // REFATORAÇÃO: Fallback melhorado com mais entropia
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const randomPart2 = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private initialized = false;

  constructor() {
    // REFATORAÇÃO: Lazy initialization para evitar erros no SSR
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.loadFromStorage();
    this.setupGlobalErrorHandlers();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // REFATORAÇÃO: Validação dos dados carregados
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-MAX_LOGS);
        }
      }
    } catch (e) {
      console.warn("Failed to load logs from storage:", e);
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent logs
      const logsToSave = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (e) {
      // REFATORAÇÃO: Log do erro sem causar loop
      console.warn("Failed to save logs to storage:", e);
    }
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener("error", (event) => {
      this.error("GLOBAL", "Unhandled error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.error("GLOBAL", "Unhandled promise rejection", {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });
  }

  private createEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown
  ): LogEntry {
    const entry: LogEntry = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // REFATORAÇÃO: Type-safe stack extraction
    if (
      level === "error" &&
      data &&
      typeof data === "object" &&
      "stack" in data
    ) {
      entry.stack = String((data as { stack: unknown }).stack);
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
      if (entry.level === "error") {
        const errorDescription =
          entry.data &&
          typeof entry.data === "object" &&
          "error" in entry.data
            ? String((entry.data as { error: unknown }).error)
            : undefined;

        toast.error(`[${entry.category}] ${entry.message}`, {
          description: errorDescription,
          duration: 5000,
        });
      } else if (entry.level === "warn") {
        toast.warning(`[${entry.category}] ${entry.message}`, {
          duration: 3000,
        });
      }
    }

    // Also log to console in development
    const consoleMethod =
      entry.level === "error"
        ? "error"
        : entry.level === "warn"
        ? "warn"
        : entry.level === "debug"
        ? "debug"
        : "log";

    console[consoleMethod](
      `[${entry.category}] ${entry.message}`,
      entry.data || ""
    );
  }

  private notifyListeners() {
    // REFATORAÇÃO: Cópia defensiva para evitar mutações
    const logsCopy = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(logsCopy);
      } catch (e) {
        console.error("Log listener error:", e);
      }
    });
  }

  debug(category: string, message: string, data?: unknown) {
    this.addLog(this.createEntry("debug", category, message, data));
  }

  info(category: string, message: string, data?: unknown) {
    this.addLog(this.createEntry("info", category, message, data));
  }

  warn(category: string, message: string, data?: unknown) {
    this.addLog(this.createEntry("warn", category, message, data));
  }

  error(category: string, message: string, data?: unknown) {
    this.addLog(this.createEntry("error", category, message, data));
  }

  // API call logging helper
  apiCall(
    endpoint: string,
    method: string,
    status: number,
    duration: number,
    error?: string
  ) {
    const level: LogLevel = status >= 400 ? "error" : "info";
    this.addLog(
      this.createEntry(level, "API", `${method} ${endpoint}`, {
        status,
        duration: `${duration}ms`,
        error,
      })
    );
  }

  // Auth event logging
  auth(action: string, success: boolean, details?: unknown) {
    const level: LogLevel = success ? "info" : "error";
    this.addLog(
      this.createEntry(level, "AUTH", action, { success, ...(details as object || {}) })
    );
  }

  // Navigation logging
  navigate(from: string, to: string) {
    this.info("NAV", `Navigation: ${from} → ${to}`);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs filtered by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  // Get logs filtered by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
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
    const headers = ["timestamp", "level", "category", "message", "data"];
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.category,
      log.message,
      JSON.stringify(log.data || ""),
    ]);
    return [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
  }
}

// Singleton instance
export const logger = new Logger();

// Hook for React components
import { useState, useEffect } from "react";

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

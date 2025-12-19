/**
 * REFATORAÇÃO: Constantes centralizadas para eliminar números mágicos
 * e facilitar manutenção e configuração do sistema
 */

// === SCORING CONSTANTS ===
export const SCORING = {
  /** Número de dias para 100% de longevidade score */
  MAX_LONGEVITY_DAYS: 60,
  /** Peso do score de longevidade no winning score */
  LONGEVITY_WEIGHT: 0.6,
  /** Peso do score de engagement no winning score */
  ENGAGEMENT_WEIGHT: 0.4,
  
  // Thresholds de tier
  CHAMPION_THRESHOLD: 85,
  STRONG_THRESHOLD: 70,
  PROMISING_THRESHOLD: 50,
  
  // Risk levels
  HIGH_RISK_THRESHOLD: 70,
  MEDIUM_RISK_THRESHOLD: 40,
} as const;

// === PAGINATION ===
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  ALERTS_LIMIT: 50,
  TOP_ADVERTISERS_LIMIT: 5,
} as const;

// === RATE LIMITING ===
export const RATE_LIMITS = {
  AUTH_MAX_ATTEMPTS: 5,
  AUTH_WINDOW_MS: 300000, // 5 minutes
  SEARCH_MAX_REQUESTS: 30,
  SEARCH_WINDOW_MS: 60000, // 1 minute
  MAX_ENTRIES: 10000, // Máximo de entradas no store antes de limpeza
  CLEANUP_INTERVAL_MS: 60000, // Intervalo de limpeza
} as const;

// === CACHE TIMES ===
export const CACHE_TIMES = {
  STALE_TIME_DEFAULT: 5 * 60 * 1000, // 5 minutes
  STALE_TIME_DASHBOARD: 2 * 60 * 1000, // 2 minutes
  GC_TIME: 30 * 60 * 1000, // 30 minutes
  REFETCH_INTERVAL_ALERTS: 30000, // 30 seconds
  REFETCH_INTERVAL_DASHBOARD: 60000, // 1 minute
} as const;

// === SECURITY ===
export const SECURITY = {
  MAX_LOG_ENTRIES: 1000,
  MAX_INPUT_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  URL_MAX_LENGTH: 2048,
  SEARCH_QUERY_MAX_LENGTH: 200,
} as const;

// === WINNING SCORE TIERS ===
export const WINNING_TIERS = {
  CHAMPION: { min: 85, label: "Champion", color: "hsl(45, 93%, 47%)" },
  STRONG: { min: 70, label: "Strong", color: "hsl(142, 71%, 45%)" },
  PROMISING: { min: 50, label: "Promising", color: "hsl(217, 91%, 60%)" },
  TESTING: { min: 0, label: "Testing", color: "hsl(var(--muted))" },
} as const;

/**
 * REFATORAÇÃO: Função utilitária para calcular winning score
 * Centralizada para evitar duplicação de lógica
 */
export function calculateWinningScoreFromValues(
  longevityDays: number | null,
  engagementScore: number | null
): number {
  const days = longevityDays || 0;
  const longevityScore = Math.min(100, (days / SCORING.MAX_LONGEVITY_DAYS) * 100);
  const engagement = engagementScore || 0;
  return Math.round(
    longevityScore * SCORING.LONGEVITY_WEIGHT + 
    engagement * SCORING.ENGAGEMENT_WEIGHT
  );
}

/**
 * Determina o tier baseado no winning score
 */
export function getWinningTier(score: number): keyof typeof WINNING_TIERS {
  if (score >= SCORING.CHAMPION_THRESHOLD) return "CHAMPION";
  if (score >= SCORING.STRONG_THRESHOLD) return "STRONG";
  if (score >= SCORING.PROMISING_THRESHOLD) return "PROMISING";
  return "TESTING";
}

/**
 * Determina o risk level baseado no suspicion score
 */
export function getRiskLevel(suspicionScore: number | null): "low" | "medium" | "high" {
  const score = suspicionScore || 0;
  if (score >= SCORING.HIGH_RISK_THRESHOLD) return "high";
  if (score >= SCORING.MEDIUM_RISK_THRESHOLD) return "medium";
  return "low";
}

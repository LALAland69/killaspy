import { useMemo } from "react";
import type { Ad } from "@/hooks/useAds";

export interface WinningScore {
  total: number;
  longevityScore: number;
  engagementScore: number;
  isWinner: boolean;
  tier: "champion" | "strong" | "promising" | "testing";
}

/**
 * Calcula o Winning Score de um anúncio baseado no modelo Adsparo
 * 
 * Critérios:
 * - Longevidade (peso 60%): Ads rodando há mais tempo = mais lucrativos
 * - Engagement (peso 40%): Score de engajamento do ad
 * 
 * Classificação:
 * - Champion (85-100): Anúncio comprovadamente vencedor
 * - Strong (70-84): Performance forte, provavelmente escalado
 * - Promising (50-69): Potencial, em fase de teste/otimização
 * - Testing (0-49): Novo ou em teste inicial
 */
export function calculateWinningScore(ad: Ad): WinningScore {
  // Longevidade: 0-100 baseado em dias ativos
  // 60+ dias = 100%, escala linear até lá
  const longevityDays = ad.longevity_days || 0;
  const longevityScore = Math.min(100, (longevityDays / 60) * 100);
  
  // Engagement: já vem como 0-100
  const engagementScore = ad.engagement_score || 0;
  
  // Score total ponderado
  const total = Math.round(longevityScore * 0.6 + engagementScore * 0.4);
  
  // Determinar tier
  let tier: WinningScore["tier"];
  if (total >= 85) {
    tier = "champion";
  } else if (total >= 70) {
    tier = "strong";
  } else if (total >= 50) {
    tier = "promising";
  } else {
    tier = "testing";
  }
  
  // É vencedor se tier é champion ou strong
  const isWinner = total >= 70;
  
  return {
    total,
    longevityScore: Math.round(longevityScore),
    engagementScore,
    isWinner,
    tier,
  };
}

export function useWinningAds(ads: Ad[] | undefined) {
  return useMemo(() => {
    if (!ads) return { adsWithScore: [], winners: [], stats: null };
    
    const adsWithScore = ads.map(ad => ({
      ...ad,
      winningScore: calculateWinningScore(ad),
    }));
    
    const winners = adsWithScore.filter(ad => ad.winningScore.isWinner);
    
    const stats = {
      totalAds: ads.length,
      totalWinners: winners.length,
      champions: adsWithScore.filter(ad => ad.winningScore.tier === "champion").length,
      strong: adsWithScore.filter(ad => ad.winningScore.tier === "strong").length,
      promising: adsWithScore.filter(ad => ad.winningScore.tier === "promising").length,
      testing: adsWithScore.filter(ad => ad.winningScore.tier === "testing").length,
      avgWinningScore: Math.round(
        adsWithScore.reduce((sum, ad) => sum + ad.winningScore.total, 0) / ads.length
      ),
    };
    
    return { adsWithScore, winners, stats };
  }, [ads]);
}

export function getTierLabel(tier: WinningScore["tier"]): string {
  switch (tier) {
    case "champion": return "🏆 Champion";
    case "strong": return "💪 Strong";
    case "promising": return "📈 Promising";
    case "testing": return "🧪 Testing";
  }
}

export function getTierColor(tier: WinningScore["tier"]): string {
  switch (tier) {
    case "champion": return "text-yellow-500";
    case "strong": return "text-green-500";
    case "promising": return "text-blue-500";
    case "testing": return "text-muted-foreground";
  }
}

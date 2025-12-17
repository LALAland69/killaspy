import { useMemo } from "react";
import { useAds } from "./useAds";

interface AdVariationGroup {
  groupId: string;
  advertiser_id: string | null;
  page_name: string | null;
  baseHeadline: string | null;
  ads: Array<{
    id: string;
    headline: string | null;
    primary_text: string | null;
    cta: string | null;
    media_url: string | null;
    start_date: string | null;
    suspicion_score: number | null;
    status: string | null;
  }>;
  variationCount: number;
  similarity: number;
}

// Simple text similarity using Jaccard index
function calculateSimilarity(text1: string | null, text2: string | null): number {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Generate a fingerprint for grouping similar ads
function generateFingerprint(ad: { 
  advertiser_id: string | null; 
  page_name: string | null;
  headline: string | null;
}): string {
  const advertiser = ad.advertiser_id || ad.page_name || 'unknown';
  
  // Extract key words from headline for fingerprint
  const headlineWords = (ad.headline || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .sort()
    .slice(0, 5)
    .join('_');
  
  return `${advertiser}_${headlineWords}`;
}

export function useAdVariations(similarityThreshold = 0.4) {
  const { data: ads, isLoading, error } = useAds();

  const variationGroups = useMemo(() => {
    if (!ads || ads.length === 0) return [];

    const groups: Map<string, AdVariationGroup> = new Map();
    const processedAds = new Set<string>();

    // Sort ads by advertiser and date for consistent grouping
    const sortedAds = [...ads].sort((a, b) => {
      if (a.advertiser_id !== b.advertiser_id) {
        return (a.advertiser_id || '').localeCompare(b.advertiser_id || '');
      }
      return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
    });

    for (const ad of sortedAds) {
      if (processedAds.has(ad.id)) continue;

      const fingerprint = generateFingerprint(ad);
      
      // Find similar ads
      const similarAds = sortedAds.filter(otherAd => {
        if (otherAd.id === ad.id || processedAds.has(otherAd.id)) return false;
        
        // Must be same advertiser or page
        const sameSource = 
          (ad.advertiser_id && ad.advertiser_id === otherAd.advertiser_id) ||
          (ad.page_name && ad.page_name === otherAd.page_name);
        
        if (!sameSource) return false;

        // Check text similarity
        const headlineSim = calculateSimilarity(ad.headline, otherAd.headline);
        const textSim = calculateSimilarity(ad.primary_text, otherAd.primary_text);
        
        // Consider similar if either headline or text is similar enough
        return headlineSim >= similarityThreshold || textSim >= similarityThreshold;
      });

      if (similarAds.length > 0) {
        // Create group with all similar ads
        const allAds = [ad, ...similarAds];
        
        // Calculate average similarity
        let totalSim = 0;
        let simCount = 0;
        for (let i = 0; i < allAds.length; i++) {
          for (let j = i + 1; j < allAds.length; j++) {
            const headlineSim = calculateSimilarity(allAds[i].headline, allAds[j].headline);
            const textSim = calculateSimilarity(allAds[i].primary_text, allAds[j].primary_text);
            totalSim += Math.max(headlineSim, textSim);
            simCount++;
          }
        }
        const avgSimilarity = simCount > 0 ? totalSim / simCount : 0;

        groups.set(fingerprint, {
          groupId: fingerprint,
          advertiser_id: ad.advertiser_id,
          page_name: ad.page_name,
          baseHeadline: ad.headline,
          ads: allAds.map(a => ({
            id: a.id,
            headline: a.headline,
            primary_text: a.primary_text,
            cta: a.cta,
            media_url: a.media_url,
            start_date: a.start_date,
            suspicion_score: a.suspicion_score,
            status: a.status,
          })),
          variationCount: allAds.length,
          similarity: Math.round(avgSimilarity * 100),
        });

        // Mark all as processed
        allAds.forEach(a => processedAds.add(a.id));
      }
    }

    // Return groups sorted by variation count (most variations first)
    return Array.from(groups.values())
      .filter(g => g.variationCount > 1)
      .sort((a, b) => b.variationCount - a.variationCount);
  }, [ads, similarityThreshold]);

  const stats = useMemo(() => {
    if (!variationGroups.length) {
      return { totalGroups: 0, totalDuplicates: 0, avgVariations: 0 };
    }

    const totalDuplicates = variationGroups.reduce((sum, g) => sum + g.variationCount, 0);
    
    return {
      totalGroups: variationGroups.length,
      totalDuplicates,
      avgVariations: Math.round(totalDuplicates / variationGroups.length * 10) / 10,
    };
  }, [variationGroups]);

  return {
    variationGroups,
    stats,
    isLoading,
    error,
  };
}

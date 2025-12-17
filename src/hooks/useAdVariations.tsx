import { useMemo } from "react";
import { useAds } from "./useAds";

interface PerformanceMetrics {
  avgEngagement: number;
  avgLongevity: number;
  bestPerformerId: string | null;
  bestPerformerScore: number;
  performanceRank: 'high' | 'medium' | 'low';
}

interface VisualHash {
  hash: string;
  similarity: number;
}

interface AdVariation {
  id: string;
  headline: string | null;
  primary_text: string | null;
  cta: string | null;
  media_url: string | null;
  start_date: string | null;
  suspicion_score: number | null;
  status: string | null;
  engagement_score: number | null;
  longevity_days: number | null;
  visual_hook_score: number | null;
  visualHash?: VisualHash;
  performanceScore: number;
}

interface AdVariationGroup {
  groupId: string;
  advertiser_id: string | null;
  page_name: string | null;
  baseHeadline: string | null;
  ads: AdVariation[];
  variationCount: number;
  similarity: number;
  performance: PerformanceMetrics;
  hasVisualVariations: boolean;
  visualGroups: Map<string, string[]>;
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

// Generate a perceptual hash from URL (simplified - uses URL patterns)
function generateVisualHash(mediaUrl: string | null): string {
  if (!mediaUrl) return 'no_media';
  
  try {
    const url = new URL(mediaUrl);
    // Extract key parts that indicate visual similarity
    const pathParts = url.pathname.split('/').filter(p => p.length > 0);
    const filename = pathParts[pathParts.length - 1] || '';
    
    // Remove common suffixes/variants and create a normalized hash
    const normalized = filename
      .replace(/[-_]?\d+x\d+/gi, '') // Remove dimensions
      .replace(/[-_]?(small|medium|large|thumb|preview)/gi, '') // Remove size variants
      .replace(/[-_]?v\d+/gi, '') // Remove version numbers
      .replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov)$/i, '') // Remove extensions
      .toLowerCase();
    
    // Create a simple hash from the normalized filename
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `vh_${Math.abs(hash).toString(16)}`;
  } catch {
    return 'invalid_url';
  }
}

// Calculate visual similarity between two URLs
function calculateVisualSimilarity(url1: string | null, url2: string | null): number {
  if (!url1 || !url2) return 0;
  
  const hash1 = generateVisualHash(url1);
  const hash2 = generateVisualHash(url2);
  
  if (hash1 === hash2) return 100;
  if (hash1 === 'no_media' || hash2 === 'no_media') return 0;
  
  // Compare URL structure for similarity
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    
    // Same domain gets base similarity
    let similarity = u1.hostname === u2.hostname ? 30 : 0;
    
    // Compare path segments
    const path1 = u1.pathname.split('/').filter(Boolean);
    const path2 = u2.pathname.split('/').filter(Boolean);
    
    const commonPaths = path1.filter(p => path2.includes(p));
    if (path1.length > 0 && path2.length > 0) {
      similarity += (commonPaths.length / Math.max(path1.length, path2.length)) * 50;
    }
    
    // Check for similar query parameters
    const params1 = Array.from(u1.searchParams.keys());
    const params2 = Array.from(u2.searchParams.keys());
    const commonParams = params1.filter(p => params2.includes(p));
    if (params1.length > 0 || params2.length > 0) {
      similarity += (commonParams.length / Math.max(params1.length, params2.length, 1)) * 20;
    }
    
    return Math.min(similarity, 100);
  } catch {
    return 0;
  }
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

// Calculate composite performance score
function calculatePerformanceScore(ad: {
  engagement_score: number | null;
  longevity_days: number | null;
  visual_hook_score: number | null;
  status: string | null;
}): number {
  let score = 0;
  
  // Engagement contributes 40%
  if (ad.engagement_score) {
    score += (ad.engagement_score / 100) * 40;
  }
  
  // Longevity contributes 35% (normalized to max 100 days)
  if (ad.longevity_days) {
    score += Math.min(ad.longevity_days / 100, 1) * 35;
  }
  
  // Visual hook score contributes 15%
  if (ad.visual_hook_score) {
    score += (ad.visual_hook_score / 100) * 15;
  }
  
  // Active status bonus 10%
  if (ad.status === 'active') {
    score += 10;
  }
  
  return Math.round(score);
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

        // Process ads with performance scores and visual hashes
        const processedVariations: AdVariation[] = allAds.map(a => {
          const performanceScore = calculatePerformanceScore(a);
          const visualHash = generateVisualHash(a.media_url);
          
          return {
            id: a.id,
            headline: a.headline,
            primary_text: a.primary_text,
            cta: a.cta,
            media_url: a.media_url,
            start_date: a.start_date,
            suspicion_score: a.suspicion_score,
            status: a.status,
            engagement_score: a.engagement_score,
            longevity_days: a.longevity_days,
            visual_hook_score: a.visual_hook_score,
            visualHash: {
              hash: visualHash,
              similarity: 100,
            },
            performanceScore,
          };
        });

        // Calculate visual similarity between ads
        const visualGroups = new Map<string, string[]>();
        for (const variation of processedVariations) {
          const hash = variation.visualHash?.hash || 'unknown';
          if (!visualGroups.has(hash)) {
            visualGroups.set(hash, []);
          }
          visualGroups.get(hash)!.push(variation.id);
        }

        // Update visual similarity scores
        for (let i = 0; i < processedVariations.length; i++) {
          for (let j = i + 1; j < processedVariations.length; j++) {
            const sim = calculateVisualSimilarity(
              processedVariations[i].media_url,
              processedVariations[j].media_url
            );
            if (sim > 50) {
              processedVariations[j].visualHash = {
                hash: processedVariations[j].visualHash?.hash || '',
                similarity: sim,
              };
            }
          }
        }

        // Calculate performance metrics
        const engagementScores = processedVariations
          .map(a => a.engagement_score)
          .filter((s): s is number => s !== null);
        const longevityDays = processedVariations
          .map(a => a.longevity_days)
          .filter((d): d is number => d !== null);
        
        const avgEngagement = engagementScores.length > 0
          ? Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
          : 0;
        const avgLongevity = longevityDays.length > 0
          ? Math.round(longevityDays.reduce((a, b) => a + b, 0) / longevityDays.length)
          : 0;
        
        // Find best performer
        const sortedByPerformance = [...processedVariations].sort(
          (a, b) => b.performanceScore - a.performanceScore
        );
        const bestPerformer = sortedByPerformance[0];
        
        // Determine performance rank
        let performanceRank: 'high' | 'medium' | 'low' = 'low';
        if (avgEngagement >= 70 || avgLongevity >= 30) {
          performanceRank = 'high';
        } else if (avgEngagement >= 40 || avgLongevity >= 14) {
          performanceRank = 'medium';
        }

        const hasVisualVariations = visualGroups.size > 1;

        groups.set(fingerprint, {
          groupId: fingerprint,
          advertiser_id: ad.advertiser_id,
          page_name: ad.page_name,
          baseHeadline: ad.headline,
          ads: processedVariations,
          variationCount: allAds.length,
          similarity: Math.round(avgSimilarity * 100),
          performance: {
            avgEngagement,
            avgLongevity,
            bestPerformerId: bestPerformer?.id || null,
            bestPerformerScore: bestPerformer?.performanceScore || 0,
            performanceRank,
          },
          hasVisualVariations,
          visualGroups,
        });

        // Mark all as processed
        allAds.forEach(a => processedAds.add(a.id));
      }
    }

    // Return groups sorted by performance score (best performing first)
    return Array.from(groups.values())
      .filter(g => g.variationCount > 1)
      .sort((a, b) => b.performance.bestPerformerScore - a.performance.bestPerformerScore);
  }, [ads, similarityThreshold]);

  const stats = useMemo(() => {
    if (!variationGroups.length) {
      return { 
        totalGroups: 0, 
        totalDuplicates: 0, 
        avgVariations: 0,
        highPerformers: 0,
        visualVariationGroups: 0,
      };
    }

    const totalDuplicates = variationGroups.reduce((sum, g) => sum + g.variationCount, 0);
    const highPerformers = variationGroups.filter(g => g.performance.performanceRank === 'high').length;
    const visualVariationGroups = variationGroups.filter(g => g.hasVisualVariations).length;
    
    return {
      totalGroups: variationGroups.length,
      totalDuplicates,
      avgVariations: Math.round(totalDuplicates / variationGroups.length * 10) / 10,
      highPerformers,
      visualVariationGroups,
    };
  }, [variationGroups]);

  return {
    variationGroups,
    stats,
    isLoading,
    error,
  };
}

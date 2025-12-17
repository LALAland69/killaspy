import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  TrendingUp,
  Calendar,
  ExternalLink,
  Diff,
  Trophy,
  Image,
  BarChart3,
  Zap,
  Clock,
  Eye
} from "lucide-react";
import { useAdVariations } from "@/hooks/useAdVariations";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";

export function AdVariationsPanel() {
  const { variationGroups, stats, isLoading } = useAdVariations();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Creative Variations & Performance
        </CardTitle>
        <CardDescription>
          Detected {stats.totalGroups} groups with {stats.totalDuplicates} total ad variations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Enhanced Stats Row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold text-primary">{stats.totalGroups}</div>
            <div className="text-xs text-muted-foreground">Variation Groups</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold text-primary">{stats.totalDuplicates}</div>
            <div className="text-xs text-muted-foreground">Total Variations</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-semibold text-primary">{stats.avgVariations}</div>
            <div className="text-xs text-muted-foreground">Avg per Group</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-semibold text-green-500">{stats.highPerformers}</div>
            <div className="text-xs text-muted-foreground">High Performers</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-2xl font-semibold text-purple-500">{stats.visualVariationGroups}</div>
            <div className="text-xs text-muted-foreground">Visual Variations</div>
          </div>
        </div>

        {variationGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No duplicate ads detected</p>
            <p className="text-sm">Import more ads to detect creative variations</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {variationGroups.map((group) => (
                <Collapsible 
                  key={group.groupId}
                  open={expandedGroups.has(group.groupId)}
                  onOpenChange={() => toggleGroup(group.groupId)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-accent/5 transition-colors text-left">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {expandedGroups.has(group.groupId) ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm truncate">
                                {group.page_name || 'Unknown Advertiser'}
                              </span>
                              <Badge variant="secondary" className="shrink-0">
                                <Layers className="h-3 w-3 mr-1" />
                                {group.variationCount} variations
                              </Badge>
                              <Badge variant="outline" className="shrink-0">
                                {group.similarity}% similar
                              </Badge>
                              <PerformanceBadge rank={group.performance.performanceRank} />
                              {group.hasVisualVariations && (
                                <Badge variant="outline" className="shrink-0 bg-purple-500/10 text-purple-500 border-purple-500/30">
                                  <Image className="h-3 w-3 mr-1" />
                                  Visual diff
                                </Badge>
                              )}
                            </div>
                            {group.baseHeadline && (
                              <p className="text-xs text-muted-foreground truncate">
                                "{group.baseHeadline}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right mr-2">
                            <div className="text-xs text-muted-foreground">Best Score</div>
                            <div className="text-sm font-semibold text-primary">
                              {group.performance.bestPerformerScore}
                            </div>
                          </div>
                          <Diff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        <Tabs defaultValue="performance" className="p-4">
                          <TabsList className="mb-4">
                            <TabsTrigger value="performance" className="text-xs">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Performance
                            </TabsTrigger>
                            <TabsTrigger value="visual" className="text-xs">
                              <Image className="h-3 w-3 mr-1" />
                              Visual Comparison
                            </TabsTrigger>
                            <TabsTrigger value="all" className="text-xs">
                              <Layers className="h-3 w-3 mr-1" />
                              All Variants
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="performance" className="space-y-4">
                            {/* Performance Summary */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 rounded-lg bg-card border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Zap className="h-3 w-3" />
                                  Avg Engagement
                                </div>
                                <div className="text-xl font-semibold">{group.performance.avgEngagement}</div>
                                <Progress value={group.performance.avgEngagement} className="h-1 mt-2" />
                              </div>
                              <div className="p-3 rounded-lg bg-card border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Clock className="h-3 w-3" />
                                  Avg Longevity
                                </div>
                                <div className="text-xl font-semibold">{group.performance.avgLongevity}d</div>
                                <Progress value={Math.min(group.performance.avgLongevity / 30 * 100, 100)} className="h-1 mt-2" />
                              </div>
                              <div className="p-3 rounded-lg bg-card border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Trophy className="h-3 w-3" />
                                  Best Score
                                </div>
                                <div className="text-xl font-semibold text-primary">{group.performance.bestPerformerScore}</div>
                                <Progress value={group.performance.bestPerformerScore} className="h-1 mt-2" />
                              </div>
                            </div>

                            {/* Ranked Variations */}
                            <div className="space-y-2">
                              <div className="text-sm font-medium flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Performance Ranking
                              </div>
                              {[...group.ads]
                                .sort((a, b) => b.performanceScore - a.performanceScore)
                                .map((ad, index) => (
                                  <VariationCard 
                                    key={ad.id} 
                                    ad={ad} 
                                    rank={index + 1}
                                    isBest={ad.id === group.performance.bestPerformerId}
                                    showPerformance
                                  />
                                ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="visual" className="space-y-4">
                            {/* Visual Hash Groups */}
                            <div className="space-y-3">
                              <div className="text-sm font-medium flex items-center gap-2">
                                <Eye className="h-4 w-4 text-purple-500" />
                                Visual Similarity Groups
                              </div>
                              
                              {group.hasVisualVariations ? (
                                <div className="space-y-4">
                                  {Array.from(group.visualGroups.entries()).map(([hash, adIds], groupIndex) => (
                                    <div key={hash} className="p-3 rounded-lg border bg-card">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="bg-purple-500/10">
                                          Visual Group {groupIndex + 1}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {adIds.length} ads with similar visuals
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {group.ads
                                          .filter(a => adIds.includes(a.id))
                                          .map(ad => (
                                            <div key={ad.id} className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                              {ad.media_url ? (
                                                <img 
                                                  src={ad.media_url} 
                                                  alt="Ad creative"
                                                  className="w-full h-full object-cover"
                                                  onError={(e) => {
                                                    e.currentTarget.src = '/placeholder.svg';
                                                  }}
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <Image className="h-8 w-8 text-muted-foreground/30" />
                                                </div>
                                              )}
                                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                <div className="flex items-center justify-between">
                                                  <Badge variant="secondary" className="text-[10px]">
                                                    {ad.visualHash?.similarity}% match
                                                  </Badge>
                                                  <Badge variant="outline" className="text-[10px]">
                                                    Score: {ad.performanceScore}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                  <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                  <p className="text-sm">All variations use similar visuals</p>
                                  <p className="text-xs">Testing focuses on copy variations</p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="all" className="space-y-3">
                            {group.ads.map((ad, index) => (
                              <VariationCard 
                                key={ad.id} 
                                ad={ad} 
                                rank={index + 1}
                                isBest={ad.id === group.performance.bestPerformerId}
                              />
                            ))}
                          </TabsContent>
                        </Tabs>
                        
                        {/* Insights */}
                        <div className="px-4 pb-4">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Performance Insights
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {group.performance.performanceRank === 'high' 
                                ? `Top performing campaign. Best variant achieves ${group.performance.bestPerformerScore} composite score with ${group.performance.avgLongevity}d average longevity.`
                                : group.performance.performanceRank === 'medium'
                                  ? `Moderate performance. Consider modeling the best variant (score: ${group.performance.bestPerformerScore}) for your campaigns.`
                                  : `Lower performance detected. Advertiser may still be optimizing or this angle isn't working well.`
                              }
                              {group.hasVisualVariations && ` Testing ${group.visualGroups.size} different visual approaches.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceBadge({ rank }: { rank: 'high' | 'medium' | 'low' }) {
  if (rank === 'high') {
    return (
      <Badge className="shrink-0 bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30">
        <Trophy className="h-3 w-3 mr-1" />
        High Performer
      </Badge>
    );
  }
  if (rank === 'medium') {
    return (
      <Badge variant="outline" className="shrink-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
        <TrendingUp className="h-3 w-3 mr-1" />
        Medium
      </Badge>
    );
  }
  return null;
}

interface VariationCardProps {
  ad: {
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
    performanceScore: number;
  };
  rank: number;
  isBest: boolean;
  showPerformance?: boolean;
}

function VariationCard({ ad, rank, isBest, showPerformance }: VariationCardProps) {
  return (
    <div className={`p-3 rounded-lg border bg-card ${isBest ? 'ring-2 ring-primary/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={isBest ? "default" : "outline"} className="text-xs">
              {isBest && <Trophy className="h-3 w-3 mr-1" />}
              #{rank}
            </Badge>
            {ad.status && (
              <Badge 
                variant={ad.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {ad.status}
              </Badge>
            )}
            {ad.start_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(ad.start_date).toLocaleDateString()}
              </span>
            )}
            {showPerformance && (
              <Badge variant="outline" className="text-xs bg-primary/10">
                Score: {ad.performanceScore}
              </Badge>
            )}
          </div>
          
          {ad.headline && (
            <p className="text-sm font-medium mb-1">
              {ad.headline}
            </p>
          )}
          
          {ad.primary_text && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {ad.primary_text}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {ad.cta && (
              <Badge variant="outline" className="text-xs">
                CTA: {ad.cta}
              </Badge>
            )}
            {ad.engagement_score !== null && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Eng: {ad.engagement_score}
              </Badge>
            )}
            {ad.longevity_days !== null && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {ad.longevity_days}d
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {ad.suspicion_score !== null && (
            <ScoreBadge score={ad.suspicion_score} />
          )}
          {ad.media_url && (
            <a
              href={ad.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

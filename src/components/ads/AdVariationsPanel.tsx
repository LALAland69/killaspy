import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  TrendingUp,
  Calendar,
  ExternalLink,
  Diff
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
          Creative Variations
        </CardTitle>
        <CardDescription>
          Detected {stats.totalGroups} groups with {stats.totalDuplicates} total ad variations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        </div>

        {variationGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No duplicate ads detected</p>
            <p className="text-sm">Import more ads to detect creative variations</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
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
                            <div className="flex items-center gap-2 mb-1">
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
                            </div>
                            {group.baseHeadline && (
                              <p className="text-xs text-muted-foreground truncate">
                                "{group.baseHeadline}"
                              </p>
                            )}
                          </div>
                        </div>
                        <Diff className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        <div className="p-4 space-y-3">
                          {group.ads.map((ad, index) => (
                            <div 
                              key={ad.id}
                              className="p-3 rounded-lg border bg-card"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      Variant {index + 1}
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
                                  
                                  {ad.cta && (
                                    <Badge variant="outline" className="text-xs">
                                      CTA: {ad.cta}
                                    </Badge>
                                  )}
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
                          ))}
                        </div>
                        
                        {/* Comparison insights */}
                        <div className="px-4 pb-4">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2 text-sm font-medium mb-1">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Variation Insights
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {group.variationCount > 3 
                                ? "Heavy A/B testing detected - advertiser is actively optimizing creatives"
                                : group.variationCount > 1 
                                  ? "Split testing in progress - monitoring creative performance"
                                  : "Single variation detected"}
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

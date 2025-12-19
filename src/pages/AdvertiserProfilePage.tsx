import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAdvertiser, useAdvertiserDomains } from "@/hooks/useAdvertisers";
import { useAdsByAdvertiser } from "@/hooks/useAds";
import { AdsTable } from "@/components/ads/AdsTable";
import { ScoreBreakdownChart } from "@/components/advertisers/ScoreBreakdownChart";
import { DomainDistributionChart } from "@/components/advertisers/DomainDistributionChart";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, FileText, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";

export default function AdvertiserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: advertiser, isLoading: advertiserLoading } = useAdvertiser(id!);
  const { data: domains, isLoading: domainsLoading } = useAdvertiserDomains(id!);
  const { data: ads, isLoading: adsLoading } = useAdsByAdvertiser(id!);

  if (advertiserLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!advertiser) {
    return (
      <AppLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Advertiser not found</p>
          <Link to="/advertisers" className="text-primary hover:text-primary/80">
            ← Back to Advertisers
          </Link>
        </div>
      </AppLayout>
    );
  }

  const scoreBreakdownData = [
    { name: "Creative Rotation", value: Math.min(100, (advertiser.total_ads || 0) * 2), color: "hsl(var(--chart-1))" },
    { name: "Domain Disparity", value: Math.min(100, (advertiser.domains_count || 0) * 15), color: "hsl(var(--chart-2))" },
    { name: "Geo Spread", value: Math.min(100, (advertiser.countries || 0) * 10), color: "hsl(var(--chart-3))" },
    { name: "Activity Level", value: Math.min(100, ((advertiser.active_ads || 0) / Math.max(1, advertiser.total_ads || 1)) * 100), color: "hsl(var(--chart-4))" },
    { name: "Overall Risk", value: advertiser.avg_suspicion_score || 0, color: "hsl(var(--primary))" },
  ];

  const riskLevel = (advertiser.avg_suspicion_score || 0) >= 70 ? "High" : (advertiser.avg_suspicion_score || 0) >= 40 ? "Medium" : "Low";
  const riskColor = riskLevel === "High" ? "destructive" : riskLevel === "Medium" ? "secondary" : "outline";

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <Link 
          to="/advertisers" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Advertisers
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{advertiser.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Page ID: {advertiser.page_id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={riskColor as any}>{riskLevel} Risk</Badge>
            <ScoreBadge score={advertiser.avg_suspicion_score || 0} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{advertiser.total_ads}</p>
                  <p className="text-xs text-muted-foreground">Total Ads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{advertiser.active_ads}</p>
                  <p className="text-xs text-muted-foreground">Active Ads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{advertiser.domains_count}</p>
                  <p className="text-xs text-muted-foreground">Domains</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{advertiser.countries}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Suspicion Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdownChart data={scoreBreakdownData} />
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Domain Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {domainsLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <DomainDistributionChart domains={domains || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {domains && domains.length > 0 && (
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Associated Domains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {domains.map((domain) => (
                  <div 
                    key={domain.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{domain.domain}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{domain.page_count} pages</span>
                        <span>•</span>
                        <span>{domain.sales_pages} sales pages</span>
                      </div>
                    </div>
                    <ScoreBadge score={domain.suspicion_score || 0} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="mb-4 text-sm font-medium text-foreground">Ads by {advertiser.name}</h2>
          <AdsTable ads={ads as any} isLoading={adsLoading} />
        </div>
      </div>
    </AppLayout>
  );
}

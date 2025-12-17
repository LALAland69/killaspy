import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopAdvertisers } from "@/components/dashboard/TopAdvertisers";
import { AdsTable } from "@/components/ads/AdsTable";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { AdVelocityChart } from "@/components/dashboard/AdVelocityChart";
import { NicheGrowthChart } from "@/components/dashboard/NicheGrowthChart";
import { ScheduledWorkersPanel } from "@/components/dashboard/ScheduledWorkersPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users, Globe, AlertTriangle, Database, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSeedData } from "@/hooks/useSeedData";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const seedMutation = useSeedData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ad intelligence overview</p>
        </div>
        <Button 
          onClick={() => seedMutation.mutate()} 
          disabled={seedMutation.isPending}
          variant="outline"
          size="sm"
        >
          {seedMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Demo Data
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ads Tracked"
          value={isLoading ? "..." : stats?.totalAds.toLocaleString() || "0"}
          change="+847 this week"
          changeType="positive"
          icon={Search}
        />
        <StatCard
          title="Advertisers"
          value={isLoading ? "..." : stats?.totalAdvertisers.toLocaleString() || "0"}
          change="+56 this week"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Domains"
          value={isLoading ? "..." : stats?.totalDomains.toLocaleString() || "0"}
          change="+124 this week"
          changeType="positive"
          icon={Globe}
        />
        <StatCard
          title="High Risk Detected"
          value={isLoading ? "..." : stats?.highRiskAds.toLocaleString() || "0"}
          change="+12 today"
          changeType="negative"
          icon={AlertTriangle}
          highlight
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Ad Velocity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AdVelocityChart />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Niche Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <NicheGrowthChart />
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentActivity />
        <TopAdvertisers />
        <ScheduledWorkersPanel />
      </div>

      {/* Ads Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Latest Flagged Ads</h2>
          <a href="/ads" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </a>
        </div>
        <AdsTable limit={5} />
      </div>
    </div>
  );
}

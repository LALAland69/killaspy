import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopAdvertisers } from "@/components/dashboard/TopAdvertisers";
import { AdsTable } from "@/components/ads/AdsTable";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { AdVelocityChart } from "@/components/dashboard/AdVelocityChart";
import { NicheGrowthChart } from "@/components/dashboard/NicheGrowthChart";
import { ScheduledWorkersPanel } from "@/components/dashboard/ScheduledWorkersPanel";
import { WinningDistributionChart } from "@/components/dashboard/WinningDistributionChart";
import { LogsWidget } from "@/components/dashboard/LogsWidget";
import { FacebookApiHistoryPanel } from "@/components/dashboard/FacebookApiHistoryPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Search, Users, Globe, AlertTriangle, Database, Loader2, Trophy, TrendingUp, Wifi } from "lucide-react";
import { DashboardProvider, useDashboardData } from "@/contexts/DashboardContext";
import { useDashboardRealtime } from "@/hooks/useRealtimeSubscription";
import { useSeedData } from "@/hooks/useSeedData";
import { useRenderTime } from "@/hooks/usePerformanceMonitor";
import { memo } from "react";

// Memoized stats grid component
const StatsGrid = memo(function StatsGrid() {
  const { data, isLoading } = useDashboardData();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Ads Tracked"
        value={isLoading ? "..." : data?.stats.totalAds.toLocaleString() || "0"}
        change="+847 this week"
        changeType="positive"
        icon={Search}
      />
      <StatCard
        title="Advertisers"
        value={isLoading ? "..." : data?.stats.totalAdvertisers.toLocaleString() || "0"}
        change="+56 this week"
        changeType="positive"
        icon={Users}
      />
      <StatCard
        title="Domains"
        value={isLoading ? "..." : data?.stats.totalDomains.toLocaleString() || "0"}
        change="+124 this week"
        changeType="positive"
        icon={Globe}
      />
      <StatCard
        title="Winning Ads"
        value={isLoading ? "..." : data?.winningStats?.totalWinners.toLocaleString() || "0"}
        change={`Avg score: ${data?.winningStats?.avgWinningScore || 0}`}
        changeType="positive"
        icon={Trophy}
      />
      <StatCard
        title="High Risk"
        value={isLoading ? "..." : data?.stats.highRiskAds.toLocaleString() || "0"}
        change="+12 today"
        changeType="negative"
        icon={AlertTriangle}
        highlight
      />
    </div>
  );
});

// Memoized winning stats mini cards
const WinningStatsMiniCards = memo(function WinningStatsMiniCards() {
  const { data } = useDashboardData();

  if (!data?.winningStats) return null;

  return (
    <div className="grid gap-3 grid-cols-4">
      <Card className="border-border/50 bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-500">{data.winningStats.champions}</p>
            <p className="text-xs text-muted-foreground">Champions</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-green-500/10 border-green-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{data.winningStats.strong}</p>
            <p className="text-xs text-muted-foreground">Strong</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{data.winningStats.promising}</p>
            <p className="text-xs text-muted-foreground">Promising</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.winningStats.testing}</p>
            <p className="text-xs text-muted-foreground">Testing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Main dashboard content component
function DashboardContent() {
  useRenderTime("Dashboard");
  const { isSubscribed } = useDashboardRealtime();
  const seedMutation = useSeedData();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">Ad intelligence overview</p>
            <Badge variant={isSubscribed ? "default" : "secondary"} className="gap-1 text-xs">
              <Wifi className="h-3 w-3" />
              {isSubscribed ? "Live" : "..."}
            </Badge>
          </div>
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

      {/* Stats Grid - Memoized */}
      <StatsGrid />

      {/* Winning Stats Mini Cards - Memoized */}
      <WinningStatsMiniCards />

      {/* Charts Row - All charts now use DashboardContext data */}
      <div className="grid gap-6 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium text-foreground">Winning Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <WinningDistributionChart />
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
      <div className="grid gap-6 lg:grid-cols-5">
        <RecentActivity />
        <TopAdvertisers />
        <ScheduledWorkersPanel />
        <LogsWidget />
        <FacebookApiHistoryPanel />
      </div>

      {/* Ads Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Latest Flagged Ads</h2>
          <Link to="/ads" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        <AdsTable limit={5} />
      </div>
    </div>
  );
}

// Wrap in DashboardProvider for shared data context
export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

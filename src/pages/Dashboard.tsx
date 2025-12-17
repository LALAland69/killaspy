import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopAdvertisers } from "@/components/dashboard/TopAdvertisers";
import { AdsTable } from "@/components/ads/AdsTable";
import { Search, Users, Globe, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ad intelligence overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ads Tracked"
          value="12,847"
          change="+847 this week"
          changeType="positive"
          icon={Search}
        />
        <StatCard
          title="Advertisers"
          value="1,234"
          change="+56 this week"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Domains"
          value="3,421"
          change="+124 this week"
          changeType="positive"
          icon={Globe}
        />
        <StatCard
          title="High Risk Detected"
          value="89"
          change="+12 today"
          changeType="negative"
          icon={AlertTriangle}
          highlight
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <TopAdvertisers />
      </div>

      {/* Ads Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Latest Flagged Ads</h2>
          <a href="/ads" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </a>
        </div>
        <AdsTable />
      </div>
    </div>
  );
}

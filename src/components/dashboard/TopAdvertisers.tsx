import { ScoreBadge } from "./ScoreBadge";
import { ChevronRight, Loader2 } from "lucide-react";
import { useDashboardData } from "@/contexts/DashboardContext";
import { Link } from "react-router-dom";
import { memo } from "react";

// Memoized to prevent unnecessary re-renders
export const TopAdvertisers = memo(function TopAdvertisers() {
  const { data, isLoading } = useDashboardData();
  
  const advertisers = data?.topAdvertisers ?? [];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-medium text-foreground">Top Suspicious Advertisers</h3>
        </div>
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (advertisers.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="border-b border-border/50 px-5 py-4">
          <h3 className="text-sm font-medium text-foreground">Top Suspicious Advertisers</h3>
        </div>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          No advertisers found
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-medium text-foreground">Top Suspicious Advertisers</h3>
      </div>
      <div className="divide-y divide-border/50">
        {advertisers.map((advertiser) => (
          <Link
            key={advertiser.id}
            to={`/advertisers/${advertiser.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{advertiser.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{advertiser.total_ads ?? 0} ads</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBadge score={advertiser.avg_suspicion_score ?? 0} />
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

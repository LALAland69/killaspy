import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { useAdvertisers } from "@/hooks/useAdvertisers";
import { Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function AdvertisersTable() {
  const { data: advertisers, isLoading } = useAdvertisers();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!advertisers || advertisers.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <p className="text-sm text-muted-foreground">No advertisers found. Seed demo data to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Advertiser</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Ads</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Ads</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Domains</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Countries</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. Score</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {advertisers.map((advertiser) => (
              <tr key={advertiser.id} className="data-table-row">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{advertiser.name}</p>
                    <p className="text-xs text-muted-foreground">{advertiser.page_id}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-foreground">{advertiser.total_ads}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-foreground">{advertiser.active_ads}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-foreground">{advertiser.domains_count}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-foreground">{advertiser.countries}</span>
                </td>
                <td className="px-4 py-4">
                  <ScoreBadge score={advertiser.avg_suspicion_score || 0} />
                </td>
                <td className="px-4 py-4">
                  <Link 
                    to={`/advertisers/${advertiser.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    View Profile
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

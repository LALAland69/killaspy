import { ScoreBadge } from "./ScoreBadge";
import { ChevronRight } from "lucide-react";

interface Advertiser {
  id: string;
  name: string;
  activeAds: number;
  countries: number;
  domains: number;
  avgScore: number;
}

const advertisers: Advertiser[] = [
  { id: "1", name: "Crypto Wealth Academy", activeAds: 47, countries: 12, domains: 8, avgScore: 89 },
  { id: "2", name: "FitLife Pro", activeAds: 124, countries: 7, domains: 3, avgScore: 72 },
  { id: "3", name: "Finance Freedom Co", activeAds: 89, countries: 5, domains: 6, avgScore: 65 },
  { id: "4", name: "Natural Health Store", activeAds: 56, countries: 4, domains: 2, avgScore: 41 },
];

export function TopAdvertisers() {
  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-medium text-foreground">Top Suspicious Advertisers</h3>
      </div>
      <div className="divide-y divide-border/50">
        {advertisers.map((advertiser) => (
          <div key={advertiser.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors cursor-pointer group">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{advertiser.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{advertiser.activeAds} ads</span>
                <span className="text-border">·</span>
                <span>{advertiser.countries} countries</span>
                <span className="text-border">·</span>
                <span>{advertiser.domains} domains</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBadge score={advertiser.avgScore} />
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

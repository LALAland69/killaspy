import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAds, type Ad } from "@/hooks/useAds";
import { format } from "date-fns";

interface AdsTableProps {
  limit?: number;
  ads?: Ad[];
  isLoading?: boolean;
}

export function AdsTable({ limit, ads: providedAds, isLoading: providedLoading }: AdsTableProps) {
  const { data: fetchedAds, isLoading: fetchLoading } = useAds(limit);
  
  const ads = providedAds || fetchedAds;
  const isLoading = providedLoading !== undefined ? providedLoading : fetchLoading;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border/50 bg-card">
        <p className="text-sm text-muted-foreground">No ads found. Seed demo data to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Creative</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Page / Copy</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">CTA</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Region</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="data-table-row">
                <td className="px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                    {ad.media_type === "video" ? (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-xs space-y-1">
                    <p className="text-sm font-medium text-foreground">{ad.page_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{ad.primary_text}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {ad.cta || "N/A"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-muted-foreground">{ad.region || ad.countries?.join(", ") || "N/A"}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ad.start_date ? format(new Date(ad.start_date), "yyyy-MM-dd") : "N/A"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {ad.domains?.domain ? (
                    <a 
                      href={`https://${ad.domains.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {ad.domains.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <ScoreBadge score={ad.suspicion_score || 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

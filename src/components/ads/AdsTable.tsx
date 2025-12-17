import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Image as ImageIcon } from "lucide-react";

interface Ad {
  id: string;
  pageName: string;
  creative: "video" | "image";
  primaryText: string;
  cta: string;
  country: string;
  startDate: string;
  domain: string;
  score: number;
  status: "active" | "inactive";
}

const mockAds: Ad[] = [
  {
    id: "1",
    pageName: "FitLife Pro",
    creative: "video",
    primaryText: "Transform your body in just 30 days with our proven method...",
    cta: "Shop Now",
    country: "US",
    startDate: "2024-01-15",
    domain: "fitlifepro.com",
    score: 78,
    status: "active",
  },
  {
    id: "2",
    pageName: "Crypto Wealth Academy",
    creative: "image",
    primaryText: "Learn how ordinary people are making $10k/month trading crypto...",
    cta: "Learn More",
    country: "UK",
    startDate: "2024-01-12",
    domain: "cryptowealthacademy.io",
    score: 92,
    status: "active",
  },
  {
    id: "3",
    pageName: "Natural Health Store",
    creative: "video",
    primaryText: "Discover the ancient secret to natural weight loss...",
    cta: "Shop Now",
    country: "CA",
    startDate: "2024-01-10",
    domain: "naturalhealthstore.net",
    score: 45,
    status: "active",
  },
  {
    id: "4",
    pageName: "Tech Gadgets HQ",
    creative: "image",
    primaryText: "Revolutionary smart device that everyone is talking about...",
    cta: "Order Now",
    country: "AU",
    startDate: "2024-01-08",
    domain: "techgadgetshq.com",
    score: 23,
    status: "inactive",
  },
  {
    id: "5",
    pageName: "Finance Freedom Co",
    creative: "video",
    primaryText: "This simple trick helped me pay off $50k in debt...",
    cta: "Sign Up",
    country: "US",
    startDate: "2024-01-05",
    domain: "financefreedom.co",
    score: 67,
    status: "active",
  },
];

export function AdsTable() {
  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Creative</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Page / Copy</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">CTA</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody>
            {mockAds.map((ad) => (
              <tr key={ad.id} className="data-table-row">
                <td className="px-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                    {ad.creative === "video" ? (
                      <Play className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-xs space-y-1">
                    <p className="text-sm font-medium text-foreground">{ad.pageName}</p>
                    <p className="truncate text-xs text-muted-foreground">{ad.primaryText}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {ad.cta}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-muted-foreground">{ad.country}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm tabular-nums text-muted-foreground">{ad.startDate}</span>
                </td>
                <td className="px-4 py-4">
                  <a 
                    href={`https://${ad.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {ad.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-4">
                  <ScoreBadge score={ad.score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

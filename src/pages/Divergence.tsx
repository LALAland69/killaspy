import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink, Globe, Smartphone, Monitor, ArrowRight } from "lucide-react";

interface DivergenceReport {
  id: string;
  domain: string;
  adId: string;
  pageName: string;
  score: number;
  detectedAt: string;
  snapshots: {
    condition: string;
    icon: "globe" | "smartphone" | "monitor";
    contentHash: string;
    preview: string;
  }[];
}

const reports: DivergenceReport[] = [
  {
    id: "1",
    domain: "cryptowealthacademy.io",
    adId: "AD-789456",
    pageName: "Crypto Wealth Academy",
    score: 92,
    detectedAt: "2 hours ago",
    snapshots: [
      {
        condition: "US IP + Mobile UA",
        icon: "smartphone",
        contentHash: "a7f3b2c1",
        preview: "Investment disclaimer page with generic content...",
      },
      {
        condition: "EU IP + Desktop UA",
        icon: "monitor",
        contentHash: "e9d4f5a8",
        preview: "High-pressure sales page: 'Make $10k/day trading...'",
      },
    ],
  },
  {
    id: "2",
    domain: "financefreedom.co",
    adId: "AD-123789",
    pageName: "Finance Freedom Co",
    score: 67,
    detectedAt: "5 hours ago",
    snapshots: [
      {
        condition: "Direct Access",
        icon: "globe",
        contentHash: "b8c2d3e4",
        preview: "Blog article about financial tips...",
      },
      {
        condition: "With Facebook Referer",
        icon: "globe",
        contentHash: "f1a2b3c4",
        preview: "Webinar registration with countdown timer...",
      },
    ],
  },
];

const iconMap = {
  globe: Globe,
  smartphone: Smartphone,
  monitor: Monitor,
};

export default function Divergence() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Divergence Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Content differences detected across varying access conditions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Divergences</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">247</p>
        </div>
        <div className="stat-card border-primary/30 glow-primary">
          <p className="text-sm text-muted-foreground">High Probability</p>
          <p className="mt-1 text-2xl font-semibold text-primary">89</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Analyzed Today</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">1,234</p>
        </div>
      </div>

      {/* Reports */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-border/50 bg-card overflow-hidden">
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-md bg-secondary p-2">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://${report.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {report.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Badge variant="secondary" className="text-xs">{report.adId}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {report.pageName} · Detected {report.detectedAt}
                  </p>
                </div>
              </div>
              <ScoreBadge score={report.score} showLabel />
            </div>

            {/* Snapshots Comparison */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
              {report.snapshots.map((snapshot, index) => {
                const Icon = iconMap[snapshot.icon];
                return (
                  <div key={index} className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{snapshot.condition}</span>
                      <span className="text-border">·</span>
                      <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">#{snapshot.contentHash}</code>
                    </div>
                    <div className="rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
                      {snapshot.preview}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="border-t border-border/50 px-5 py-3 bg-secondary/30">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                View Full Report
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

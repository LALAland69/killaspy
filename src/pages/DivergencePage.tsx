import { AppLayout } from "@/components/layout/AppLayout";
import { useDivergenceReports, useDivergenceStats } from "@/hooks/useDivergence";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, ExternalLink, Globe, Smartphone, Monitor, ArrowRight, 
  AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DivergencePage() {
  const { data: reports, isLoading: reportsLoading } = useDivergenceReports();
  const { data: stats, isLoading: statsLoading } = useDivergenceStats();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Divergence Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Content differences detected across varying access conditions (White URL vs Black URL)
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Divergences</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-foreground">{stats?.totalDivergences || 0}</p>
            )}
          </div>
          <div className="stat-card border-primary/30 glow-primary">
            <p className="text-sm text-muted-foreground">High Probability</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-primary">{stats?.highProbability || 0}</p>
            )}
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Snapshots Captured</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-foreground">{stats?.analyzedToday || 0}</p>
            )}
          </div>
        </div>

        {/* Reports */}
        {reportsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <DivergenceReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <EmptyDivergenceState />
        )}
      </div>
    </AppLayout>
  );
}

interface DivergenceReportCardProps {
  report: {
    id: string;
    page_name: string | null;
    white_url: string | null;
    detected_black_url: string | null;
    suspicion_score: number | null;
    is_cloaked_flag: boolean | null;
    domain: { domain: string } | null;
    snapshots: any[];
  };
}

function DivergenceReportCard({ report }: DivergenceReportCardProps) {
  const whiteSnapshot = report.snapshots.find((s) => !s.is_black_page);
  const blackSnapshot = report.snapshots.find((s) => s.is_black_page);

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="rounded-md bg-secondary p-2">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {report.domain ? (
                <Link
                  to={`/domains/${report.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {report.domain.domain}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">Unknown Domain</span>
              )}
              <Badge variant="secondary" className="text-xs">AD-{report.id.slice(0, 6)}</Badge>
              {report.is_cloaked_flag && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cloaked
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {report.page_name || "Unknown Page"} · {report.snapshots.length} snapshots
            </p>
          </div>
        </div>
        <ScoreBadge score={report.suspicion_score || 0} showLabel />
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        <SnapshotPanel
          title="White URL (Safe Request)"
          snapshot={whiteSnapshot}
          url={report.white_url}
          type="white"
        />
        <SnapshotPanel
          title="Black URL (Real Offer)"
          snapshot={blackSnapshot}
          url={report.detected_black_url}
          type="black"
        />
      </div>

      <div className="border-t border-border/50 px-5 py-3 bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {report.is_cloaked_flag ? (
            <>
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span>Divergence Confirmed</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span>No divergence detected</span>
            </>
          )}
        </div>
        <Link to={`/ads/${report.id}`}>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
            View Full Report
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface SnapshotPanelProps {
  title: string;
  snapshot?: any;
  url: string | null;
  type: "white" | "black";
}

function SnapshotPanel({ title, snapshot, url, type }: SnapshotPanelProps) {
  const Icon = type === "white" ? Globe : AlertTriangle;
  const borderColor = type === "white" ? "border-green-500/30" : "border-destructive/30";
  const bgColor = type === "white" ? "bg-green-500/5" : "bg-destructive/5";
  const iconColor = type === "white" ? "text-green-500" : "text-destructive";

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="font-medium">{title}</span>
        {snapshot?.html_hash && (
          <>
            <span className="text-border">·</span>
            <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">#{snapshot.html_hash.slice(0, 8)}</code>
          </>
        )}
      </div>
      
      {url && (
        <div className={`rounded-md ${bgColor} border ${borderColor} p-2 mb-3`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-foreground hover:text-primary transition-colors break-all flex items-center gap-1"
          >
            {url}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      )}

      {snapshot ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Condition:</span>
              <p className="font-medium text-foreground mt-0.5">{snapshot.snapshot_condition}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2">
              <span className="text-muted-foreground">Response:</span>
              <p className="font-medium text-foreground mt-0.5">{snapshot.response_code || "N/A"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-secondary/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">No snapshot captured for this condition</p>
        </div>
      )}
    </div>
  );
}

function EmptyDivergenceState() {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-12 text-center">
      <Eye className="mx-auto h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 text-lg font-medium text-foreground">No Divergence Reports</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Divergence reports appear when we detect ads showing different content based on access conditions 
        (cloaking behavior). Seed demo data or trigger analysis to see reports.
      </p>
      <div className="mt-6 flex items-center justify-center gap-4">
        <Link to="/">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
        <Link to="/ads">
          <Button>View Ads</Button>
        </Link>
      </div>
    </div>
  );
}

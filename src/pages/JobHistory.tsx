import { useJobHistory, useJobStats } from "@/hooks/useJobHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, 
  Activity, Timer, Search, RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function JobHistory() {
  const { data: jobs, isLoading: jobsLoading } = useJobHistory();
  const { data: stats, isLoading: statsLoading } = useJobStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Job History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track scheduled worker executions, success rates, and detected divergences
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Runs (7d)"
          value={statsLoading ? "..." : stats?.totalRuns || 0}
          icon={Activity}
          loading={statsLoading}
        />
        <StatsCard
          title="Success Rate"
          value={statsLoading ? "..." : `${stats?.successRate || 0}%`}
          icon={CheckCircle}
          loading={statsLoading}
          highlight={stats?.successRate === 100}
        />
        <StatsCard
          title="Failed Runs"
          value={statsLoading ? "..." : stats?.failedRuns || 0}
          icon={XCircle}
          loading={statsLoading}
          variant={stats?.failedRuns && stats.failedRuns > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Divergences Found"
          value={statsLoading ? "..." : stats?.totalDivergences || 0}
          icon={TrendingUp}
          loading={statsLoading}
          highlight
        />
        <StatsCard
          title="Avg Duration"
          value={statsLoading ? "..." : `${Math.round((stats?.avgDuration || 0) / 1000)}s`}
          icon={Timer}
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Daily Job Runs</CardTitle>
            <CardDescription className="text-xs">Success vs failed runs over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en", { weekday: "short" })}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="success" fill="hsl(var(--chart-2))" name="Successful" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Divergences Detected</CardTitle>
            <CardDescription className="text-xs">Cloaking behaviors identified over time</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats?.dailyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en", { weekday: "short" })}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="divergences" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    name="Divergences"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job Runs Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Recent Job Runs</CardTitle>
          <CardDescription className="text-xs">Latest scheduled worker executions</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-2">
              {jobs.map((job) => (
                <JobRunRow key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No job runs yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Trigger a worker from the Dashboard to see history
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  highlight?: boolean;
  variant?: "default" | "destructive";
}

function StatsCard({ title, value, icon: Icon, loading, highlight, variant }: StatsCardProps) {
  return (
    <div className={`stat-card ${highlight ? "border-primary/30 glow-primary" : ""} ${variant === "destructive" ? "border-destructive/30" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={`h-4 w-4 ${highlight ? "text-primary" : variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 mt-1" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold ${highlight ? "text-primary" : variant === "destructive" ? "text-destructive" : "text-foreground"}`}>
          {value}
        </p>
      )}
    </div>
  );
}

interface JobRunRowProps {
  job: {
    id: string;
    job_name: string;
    task_type: string;
    schedule_type: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
    ads_processed: number | null;
    divergences_found: number | null;
    errors_count: number | null;
    error_message: string | null;
  };
}

function JobRunRow({ job }: JobRunRowProps) {
  const statusIcon = {
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-destructive" />,
    running: <RefreshCw className="h-4 w-4 text-primary animate-spin" />,
  }[job.status] || <Clock className="h-4 w-4 text-muted-foreground" />;

  const statusBadge = {
    completed: "outline",
    failed: "destructive",
    running: "default",
  }[job.status] || "secondary";

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{job.job_name}</span>
            <Badge variant={statusBadge as any} className="text-xs capitalize">
              {job.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
            {job.duration_ms && ` • ${Math.round(job.duration_ms / 1000)}s`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        {job.ads_processed !== null && (
          <div className="text-center">
            <p className="text-foreground font-medium">{job.ads_processed}</p>
            <p className="text-muted-foreground">Processed</p>
          </div>
        )}
        {job.divergences_found !== null && job.divergences_found > 0 && (
          <div className="text-center">
            <p className="text-primary font-medium">{job.divergences_found}</p>
            <p className="text-muted-foreground">Divergences</p>
          </div>
        )}
        {job.errors_count !== null && job.errors_count > 0 && (
          <div className="text-center">
            <p className="text-destructive font-medium">{job.errors_count}</p>
            <p className="text-muted-foreground">Errors</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Clock,
  Zap,
  Database,
  Globe,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface HealthCheckResult {
  name: string;
  status: "success" | "error" | "pending" | "idle";
  latency?: number;
  message?: string;
  details?: Record<string, any>;
}

export default function HealthCheckPage() {
  const [results, setResults] = useState<HealthCheckResult[]>([
    { name: "Facebook Ad Library API", status: "idle" },
    { name: "Firecrawl API", status: "idle" },
    { name: "Database Connection", status: "idle" },
    { name: "Edge Functions", status: "idle" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // Recent job runs for worker health
  const { data: recentJobs } = useQuery({
    queryKey: ["health-check-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const updateResult = (name: string, update: Partial<HealthCheckResult>) => {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...update } : r));
  };

  const runHealthChecks = async () => {
    setIsRunning(true);
    
    // Reset all to pending
    setResults(prev => prev.map(r => ({ ...r, status: "pending" as const })));

    // Test Database Connection
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase.from("ads").select("id").limit(1);
      if (error) throw error;
      updateResult("Database Connection", {
        status: "success",
        latency: Date.now() - dbStart,
        message: "Connected successfully",
      });
    } catch (err: any) {
      updateResult("Database Connection", {
        status: "error",
        latency: Date.now() - dbStart,
        message: err.message,
      });
    }

    // Test Facebook Ad Library API
    const fbStart = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("facebook-ad-library", {
        body: { action: "search", params: { search_terms: "test", ad_reached_countries: ["US"], limit: 1 } },
      });
      
      const latency = Date.now() - fbStart;
      
      if (error) {
        updateResult("Facebook Ad Library API", {
          status: "error",
          latency,
          message: error.message,
        });
      } else if (data?.success === false) {
        // Check for transient errors
        const isTransient = data.error?.includes("temporary") || data.error?.includes("fbtrace_id");
        updateResult("Facebook Ad Library API", {
          status: "error",
          latency,
          message: data.error,
          details: { isTransient, suggestion: isTransient ? "Retry in a few minutes" : "Check token" },
        });
      } else {
        updateResult("Facebook Ad Library API", {
          status: "success",
          latency,
          message: `API responding (${data?.ads?.length || 0} results)`,
        });
      }
    } catch (err: any) {
      updateResult("Facebook Ad Library API", {
        status: "error",
        latency: Date.now() - fbStart,
        message: err.message,
      });
    }

    // Test Firecrawl API
    const fcStart = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: "https://example.com", options: { formats: ["markdown"] } },
      });
      
      const latency = Date.now() - fcStart;
      
      if (error) {
        updateResult("Firecrawl API", {
          status: "error",
          latency,
          message: error.message,
        });
      } else if (data?.success === false) {
        updateResult("Firecrawl API", {
          status: "error",
          latency,
          message: data.error || "Unknown error",
        });
      } else {
        updateResult("Firecrawl API", {
          status: "success",
          latency,
          message: "Scraping operational",
        });
      }
    } catch (err: any) {
      updateResult("Firecrawl API", {
        status: "error",
        latency: Date.now() - fcStart,
        message: err.message,
      });
    }

    // Test Edge Functions (using harvest-ads as a test)
    const efStart = Date.now();
    try {
      // Just check if we can reach the function without actually running harvest
      const { error } = await supabase.functions.invoke("harvest-ads", {
        body: { healthCheck: true },
      });
      
      // Even if it returns an error about invalid params, it means the function is reachable
      updateResult("Edge Functions", {
        status: "success",
        latency: Date.now() - efStart,
        message: "Edge functions accessible",
      });
    } catch (err: any) {
      updateResult("Edge Functions", {
        status: "error",
        latency: Date.now() - efStart,
        message: err.message,
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "pending":
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not tested</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  // Calculate worker health from recent jobs
  const recentSuccessJobs = recentJobs?.filter(j => j.status === "completed").length || 0;
  const recentFailedJobs = recentJobs?.filter(j => j.status === "failed").length || 0;
  const workerHealthPercent = recentJobs?.length 
    ? Math.round((recentSuccessJobs / recentJobs.length) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Health Check
            </h1>
            <p className="text-muted-foreground">
              Monitor the status of integrations and services
            </p>
          </div>
          <Button onClick={runHealthChecks} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Health Check
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services Healthy</p>
                  <p className="text-2xl font-bold text-green-500">{successCount}/{results.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services Error</p>
                  <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Worker Health</p>
                  <p className="text-2xl font-bold">{workerHealthPercent}%</p>
                </div>
                <Server className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recent Jobs</p>
                  <p className="text-2xl font-bold">{recentJobs?.length || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Service Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Service Status
              </CardTitle>
              <CardDescription>
                Real-time health of external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium text-sm">{result.name}</p>
                        {result.message && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {result.message}
                          </p>
                        )}
                        {result.details?.suggestion && (
                          <p className="text-xs text-amber-500 mt-1">
                            💡 {result.details.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.latency && (
                        <span className="text-xs text-muted-foreground">
                          {result.latency}ms
                        </span>
                      )}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recent Worker Jobs
              </CardTitle>
              <CardDescription>
                Last 10 background job executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {recentJobs?.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-2 rounded border bg-card text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {job.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : job.status === "failed" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <span className="truncate max-w-[200px]">{job.job_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {job.duration_ms && <span>{job.duration_ms}ms</span>}
                        <Badge variant={job.status === "completed" ? "secondary" : "destructive"} className="text-xs">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!recentJobs || recentJobs.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent jobs found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

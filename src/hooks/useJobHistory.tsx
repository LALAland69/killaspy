import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobRun {
  id: string;
  tenant_id: string | null;
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
  metadata: Record<string, any> | null;
  created_at: string;
}

export function useJobHistory(limit = 50) {
  return useQuery({
    queryKey: ["job_history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as JobRun[];
    },
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ["job_stats"],
    queryFn: async () => {
      const { data: allJobs, error } = await supabase
        .from("job_runs")
        .select("status, divergences_found, duration_ms, started_at")
        .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const jobs = allJobs || [];
      const totalRuns = jobs.length;
      const successfulRuns = jobs.filter((j) => j.status === "completed").length;
      const failedRuns = jobs.filter((j) => j.status === "failed").length;
      const totalDivergences = jobs.reduce((sum, j) => sum + (j.divergences_found || 0), 0);
      const avgDuration = jobs.length > 0
        ? Math.round(jobs.reduce((sum, j) => sum + (j.duration_ms || 0), 0) / jobs.length)
        : 0;
      const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

      // Group by day for chart
      const byDay = jobs.reduce((acc, job) => {
        const day = new Date(job.started_at).toISOString().split("T")[0];
        if (!acc[day]) {
          acc[day] = { date: day, runs: 0, divergences: 0, success: 0, failed: 0 };
        }
        acc[day].runs++;
        acc[day].divergences += job.divergences_found || 0;
        if (job.status === "completed") acc[day].success++;
        if (job.status === "failed") acc[day].failed++;
        return acc;
      }, {} as Record<string, { date: string; runs: number; divergences: number; success: number; failed: number }>);

      const dailyStats = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalRuns,
        successfulRuns,
        failedRuns,
        totalDivergences,
        avgDuration,
        successRate,
        dailyStats,
      };
    },
  });
}

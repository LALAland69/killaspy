import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FacebookApiCheckRecord {
  id: string;
  created_at: string;
  status: string;
  metadata: {
    success?: boolean;
    message?: string;
    checked_at?: string;
    diagnostics?: {
      ad_library_http_status?: number;
      ad_library_working?: boolean;
      error_code?: number;
      error_type?: string;
    };
  } | null;
}

export function useFacebookApiHistory() {
  return useQuery({
    queryKey: ["facebook-api-history"],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from("job_runs")
        .select("id, created_at, status, metadata")
        .eq("job_name", "facebook_api_health_check")
        .gte("created_at", twentyFourHoursAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []) as FacebookApiCheckRecord[];
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

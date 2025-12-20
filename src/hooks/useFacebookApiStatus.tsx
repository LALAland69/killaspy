import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FacebookApiStatus {
  success: boolean;
  error_code?: number;
  error_type?: string;
  message?: string;
  checked_at: string;
  diagnostics?: {
    token_length?: number;
    token_prefix?: string;
    token_type?: string;
    app_id?: string;
    is_valid?: boolean;
    scopes?: string[];
    expires_at?: string;
    has_ads_read?: boolean;
    ad_library_http_status?: number;
    ad_library_working?: boolean;
    ad_library_version?: string;
    ad_library_attempt?: number;
    test_ads_returned?: number;
    ad_library_error?: {
      code: number;
      type: string;
      message: string;
      fbtrace_id?: string;
    };
  };
}

interface StatusCheckResponse {
  status: FacebookApiStatus;
  recovered: boolean;
  previous_status: string;
}

export function useFacebookApiStatus() {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  // Get last known status from job_runs
  const { data: lastStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["facebook-api-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_runs")
        .select("metadata, status, created_at")
        .eq("job_name", "facebook_api_health_check")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    },
    refetchInterval: 60000, // Check every minute
  });

  // Check status manually
  const checkStatus = useMutation({
    mutationFn: async (): Promise<StatusCheckResponse> => {
      const { data, error } = await supabase.functions.invoke(
        "check-facebook-status"
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["facebook-api-status"] });
      
      if (data.recovered) {
        toast.success("API do Facebook Recuperada!", {
          description: "A API voltou a funcionar. Você já pode importar anúncios.",
          duration: 10000,
        });
      } else if (data.status.success) {
        toast.success("API funcionando", {
          description: "A API do Facebook está operacional.",
        });
      } else {
        toast.warning("API com problemas", {
          description: data.status.message || "Erro temporário detectado.",
        });
      }
    },
    onError: (error) => {
      toast.error("Erro ao verificar status", {
        description: error.message,
      });
    },
  });

  const handleCheckStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      await checkStatus.mutateAsync();
    } finally {
      setIsChecking(false);
    }
  }, [checkStatus]);

  const parseStatusInfo = (): FacebookApiStatus | undefined => {
    if (!lastStatus?.metadata) return undefined;
    const meta = lastStatus.metadata as Record<string, unknown>;
    if (typeof meta.success === "boolean" && typeof meta.checked_at === "string") {
      return meta as unknown as FacebookApiStatus;
    }
    return undefined;
  };

  // Also return the latest check result for diagnostics
  const latestCheckResult = checkStatus.data?.status;

  const statusInfo = parseStatusInfo();
  const isWorking = lastStatus?.status === "completed";
  const lastCheckedAt = lastStatus?.created_at;

  return {
    isWorking,
    statusInfo,
    lastCheckedAt,
    isLoading: isLoadingStatus,
    isChecking: isChecking || checkStatus.isPending,
    checkStatus: handleCheckStatus,
    latestCheckResult,
  };
}

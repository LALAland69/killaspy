import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TrendValidation {
  id: string;
  tenant_id: string;
  keyword: string;
  region: string;
  trend_score: number | null;
  trend_direction: string | null;
  related_queries: { query: string; value: number }[];
  interest_over_time: { date: string; value: number }[];
  validated_at: string;
  created_at: string;
}

export interface TrendResult {
  keyword: string;
  region: string;
  trendScore: number;
  trendDirection: "rising" | "stable" | "declining";
  relatedQueries: { query: string; value: number }[];
  interestOverTime: { date: string; value: number }[];
  validatedAt: string;
}

export function useTrendValidations() {
  return useQuery({
    queryKey: ["trend_validations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trend_validations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as TrendValidation[];
    },
  });
}

export function useValidateTrend() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyword, region = "BR" }: { keyword: string; region?: string }) => {
      const { data, error } = await supabase.functions.invoke("validate-trend", {
        body: { keyword, region },
      });

      if (error) throw error;
      return data as TrendResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trend_validations"] });
      toast({
        title: "Tendência validada",
        description: `"${data.keyword}" - Score: ${data.trendScore}, Direção: ${data.trendDirection}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });
}

export function useBulkValidateTrends() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keywords, region = "BR" }: { keywords: string[]; region?: string }) => {
      const results: TrendResult[] = [];
      
      for (const keyword of keywords) {
        const { data, error } = await supabase.functions.invoke("validate-trend", {
          body: { keyword, region },
        });
        
        if (!error && data) {
          results.push(data as TrendResult);
        }
      }
      
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trend_validations"] });
      toast({
        title: "Validação em lote concluída",
        description: `${data.length} tendências validadas`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });
}

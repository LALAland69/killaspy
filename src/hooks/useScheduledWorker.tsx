import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TaskType = "divergence_test" | "status_check";
type ScheduleType = "daily" | "intraday";

interface WorkerResult {
  success: boolean;
  taskType: string;
  scheduleType: string;
  processedCount: number;
  divergencesFound: number;
  completedAt: string;
}

export function useTriggerScheduledWorker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskType, scheduleType }: { taskType: TaskType; scheduleType: ScheduleType }) => {
      const { data, error } = await supabase.functions.invoke("scheduled-worker", {
        body: { taskType, scheduleType },
      });

      if (error) throw error;
      return data as WorkerResult;
    },
    onSuccess: (data) => {
      toast({
        title: "Worker Completed",
        description: `Processed ${data.processedCount} ads. Found ${data.divergencesFound} divergences.`,
      });
      queryClient.invalidateQueries({ queryKey: ["divergence_reports"] });
      queryClient.invalidateQueries({ queryKey: ["divergence_stats"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (error) => {
      toast({
        title: "Worker Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}

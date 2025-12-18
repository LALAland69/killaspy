import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loggedEdgeFunction, logAction } from "@/lib/apiLogger";

export function useSeedData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      logAction('Seed Demo Data Started');
      
      const { data, error } = await loggedEdgeFunction("seed-demo-data");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["niche-trends"] });
      queryClient.invalidateQueries({ queryKey: ["risk-distribution"] });
      
      logAction('Seed Demo Data Success');
      toast({
        title: "Demo Data Loaded",
        description: "Sample data has been seeded successfully.",
      });
    },
    onError: (error) => {
      logAction('Seed Demo Data Error', { error: error.message });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

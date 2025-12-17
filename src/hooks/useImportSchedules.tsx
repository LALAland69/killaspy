import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImportSchedule {
  id: string;
  tenant_id: string;
  name: string;
  search_terms: string | null;
  search_page_ids: string[];
  ad_reached_countries: string[];
  ad_active_status: string;
  import_limit: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleParams {
  name: string;
  search_terms?: string;
  search_page_ids?: string[];
  ad_reached_countries?: string[];
  ad_active_status?: string;
  import_limit?: number;
}

export function useImportSchedules() {
  return useQuery({
    queryKey: ["import-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_schedules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ImportSchedule[];
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateScheduleParams) => {
      // Get user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant not found");

      const { data, error } = await supabase
        .from("import_schedules")
        .insert({
          tenant_id: profile.tenant_id,
          name: params.name,
          search_terms: params.search_terms || null,
          search_page_ids: params.search_page_ids || [],
          ad_reached_countries: params.ad_reached_countries || ["US"],
          ad_active_status: params.ad_active_status || "ACTIVE",
          import_limit: params.import_limit || 50,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-schedules"] });
      toast.success("Schedule created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });
}

export function useToggleSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("import_schedules")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-schedules"] });
      toast.success("Schedule updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("import_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-schedules"] });
      toast.success("Schedule deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });
}

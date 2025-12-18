import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger, LogEntry } from "@/lib/logger";

interface LogExport {
  id: string;
  tenant_id: string;
  user_id: string;
  file_path: string;
  file_size: number | null;
  log_count: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  created_at: string;
}

export function useLogExports() {
  return useQuery({
    queryKey: ["log-exports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("log_exports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LogExport[];
    },
  });
}

export function useExportLogsToCloud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logs: LogEntry[]) => {
      logger.info('CLOUD', 'Exporting logs to cloud storage', { count: logs.length });

      // Get user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) throw new Error("No tenant found");

      // Create file content
      const content = JSON.stringify(logs, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const fileName = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filePath = `${profile.tenant_id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('logs')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      // Get date range from logs
      const timestamps = logs.map(l => new Date(l.timestamp).getTime());
      const minDate = new Date(Math.min(...timestamps)).toISOString();
      const maxDate = new Date(Math.max(...timestamps)).toISOString();

      // Record export in database
      const { data, error } = await supabase
        .from("log_exports")
        .insert({
          tenant_id: profile.tenant_id,
          user_id: user.id,
          file_path: filePath,
          file_size: blob.size,
          log_count: logs.length,
          date_range_start: minDate,
          date_range_end: maxDate,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('CLOUD', 'Logs exported successfully', { 
        filePath, 
        size: blob.size, 
        count: logs.length 
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log-exports"] });
      toast.success("Logs exportados para a nuvem");
    },
    onError: (error) => {
      logger.error('CLOUD', 'Failed to export logs', { error: error.message });
      toast.error("Erro ao exportar logs: " + error.message);
    },
  });
}

export function useDownloadCloudLog() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('logs')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'logs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success("Download iniciado");
    },
    onError: (error) => {
      toast.error("Erro ao baixar: " + error.message);
    },
  });
}

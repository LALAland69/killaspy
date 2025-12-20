import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook that listens for Facebook API recovery alerts in real-time
 * and shows a notification when the API comes back online.
 */
export function useFacebookApiRecoveryNotification() {
  const queryClient = useQueryClient();
  const hasShownRecoveryRef = useRef(false);

  useEffect(() => {
    // Subscribe to new alerts of type 'api_status'
    const channel = supabase
      .channel("facebook-api-recovery")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: "alert_type=eq.api_status",
        },
        (payload) => {
          const newAlert = payload.new as {
            id: string;
            title: string;
            message: string;
            metadata: {
              api?: string;
              current_status?: string;
              recovered_at?: string;
            };
          };

          // Check if this is a Facebook API recovery alert
          if (
            newAlert.metadata?.api === "facebook" &&
            newAlert.metadata?.current_status === "working"
          ) {
            // Prevent duplicate notifications
            if (hasShownRecoveryRef.current) return;
            hasShownRecoveryRef.current = true;

            // Show prominent notification
            toast.success("🎉 API do Facebook Recuperada!", {
              description: newAlert.message || "A API voltou a funcionar. Você já pode importar anúncios.",
              duration: 15000,
              action: {
                label: "Ver Status",
                onClick: () => {
                  // Redirect to diagnostics or refresh status
                  queryClient.invalidateQueries({ queryKey: ["facebook-api-status"] });
                },
              },
            });

            // Reset flag after some time to allow future notifications
            setTimeout(() => {
              hasShownRecoveryRef.current = false;
            }, 60000);

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["facebook-api-status"] });
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

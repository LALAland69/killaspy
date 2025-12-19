// Realtime subscription hook for live data updates
import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "ads" | "advertisers" | "domains" | "alerts" | "job_runs";

interface UseRealtimeOptions {
  tables: TableName[];
  enabled?: boolean;
  onUpdate?: (table: string, payload: any) => void;
}

// Track subscription status
const subscriptionStatus = new Map<string, boolean>();

export function useRealtimeSubscription(options: UseRealtimeOptions) {
  const { tables, enabled = true, onUpdate } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (table: string, payload: RealtimePostgresChangesPayload<any>) => {
      logger.info("REALTIME", `${payload.eventType} on ${table}`, {
        new: payload.new ? (payload.new as any).id : null,
        old: payload.old ? (payload.old as any).id : null,
      });

      // Invalidate related queries
      switch (table) {
        case "ads":
          queryClient.invalidateQueries({ queryKey: ["ads"] });
          queryClient.invalidateQueries({ queryKey: ["ads-infinite"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-optimized"] });
          break;
        case "advertisers":
          queryClient.invalidateQueries({ queryKey: ["advertisers"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-optimized"] });
          break;
        case "domains":
          queryClient.invalidateQueries({ queryKey: ["domains"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-optimized"] });
          break;
        case "alerts":
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["unread-alerts-count"] });
          break;
        case "job_runs":
          queryClient.invalidateQueries({ queryKey: ["job_history"] });
          queryClient.invalidateQueries({ queryKey: ["job_stats"] });
          break;
      }

      // Call custom handler
      onUpdate?.(table, payload);
    },
    [queryClient, onUpdate]
  );

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const channelName = `realtime-${tables.join("-")}`;

    // Don't recreate if already subscribed
    if (subscriptionStatus.get(channelName)) {
      return;
    }

    logger.info("REALTIME", "Setting up subscription", { tables });

    let channel = supabase.channel(channelName);

    // Add listeners for each table
    tables.forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => handleChange(table, payload)
      );
    });

    channel.subscribe((status) => {
      logger.info("REALTIME", `Subscription status: ${status}`, { tables });
      subscriptionStatus.set(channelName, status === "SUBSCRIBED");
    });

    channelRef.current = channel;

    return () => {
      logger.info("REALTIME", "Cleaning up subscription", { tables });
      subscriptionStatus.set(channelName, false);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, tables.join(","), handleChange]);

  return {
    isSubscribed: tables.every((t) => subscriptionStatus.get(`realtime-${tables.join("-")}`)),
  };
}

// Convenience hook for dashboard realtime updates
export function useDashboardRealtime() {
  return useRealtimeSubscription({
    tables: ["ads", "advertisers", "alerts", "job_runs"],
  });
}

// Convenience hook for alerts realtime
export function useAlertsRealtime() {
  return useRealtimeSubscription({
    tables: ["alerts"],
  });
}

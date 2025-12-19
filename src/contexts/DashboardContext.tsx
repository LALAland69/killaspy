import { createContext, useContext, ReactNode } from "react";
import { useOptimizedDashboard, DashboardData } from "@/hooks/useOptimizedDashboard";

interface DashboardContextType {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useOptimizedDashboard();

  return (
    <DashboardContext.Provider
      value={{
        data,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardProvider");
  }
  return context;
}

// Hook alternativo que retorna dados vazios se fora do contexto (para uso em charts standalone)
export function useDashboardData() {
  const context = useContext(DashboardContext);
  return context ?? { data: undefined, isLoading: true, error: null, refetch: () => {} };
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRiskDistribution } from "@/hooks/useDashboardStats";
import { Loader2 } from "lucide-react";

export function RiskDistributionChart() {
  const { data, isLoading } = useRiskDistribution();

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.every(d => d.value === 0)) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-xs text-muted-foreground">{entry.name} ({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

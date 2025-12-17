import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useWinningDistribution } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

export function WinningDistributionChart() {
  const { data, isLoading } = useWinningDistribution();

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!data || data.every(d => d.value === 0)) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => [`${value} ads`, ""]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

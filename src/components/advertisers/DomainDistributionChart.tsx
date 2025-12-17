import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DomainDistributionChartProps {
  domains: {
    domain: string;
    suspicion_score: number | null;
  }[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DomainDistributionChart({ domains }: DomainDistributionChartProps) {
  if (!domains || domains.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No domains found</p>
      </div>
    );
  }

  const data = domains.map((d, i) => ({
    name: d.domain,
    value: d.suspicion_score || 0,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
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
            formatter={(value: number, name: string) => [`Score: ${value}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

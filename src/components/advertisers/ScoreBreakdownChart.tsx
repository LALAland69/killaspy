import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreBreakdownChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function ScoreBreakdownChart({ data }: ScoreBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No score data available</p>
      </div>
    );
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            domain={[0, 100]}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

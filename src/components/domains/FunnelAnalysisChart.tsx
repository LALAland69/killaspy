import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface FunnelAnalysisChartProps {
  salesPages: number;
  compliancePages: number;
  totalPages: number;
}

export function FunnelAnalysisChart({ salesPages, compliancePages, totalPages }: FunnelAnalysisChartProps) {
  const otherPages = Math.max(0, totalPages - salesPages - compliancePages);
  
  const data = [
    { name: "Sales", value: salesPages, color: "hsl(var(--primary))" },
    { name: "Compliance", value: compliancePages, color: "hsl(var(--chart-2))" },
    { name: "Other", value: otherPages, color: "hsl(var(--muted-foreground))" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis 
          dataKey="name" 
          type="category" 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12}
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value: number) => [`${value} pages`, ""]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

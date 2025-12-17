import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockVelocityData = [
  { date: "Jan 1", ads: 45 },
  { date: "Jan 8", ads: 67 },
  { date: "Jan 15", ads: 89 },
  { date: "Jan 22", ads: 124 },
  { date: "Jan 29", ads: 156 },
  { date: "Feb 5", ads: 189 },
  { date: "Feb 12", ads: 234 },
];

export function AdVelocityChart() {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockVelocityData}>
          <defs>
            <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px"
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Area 
            type="monotone" 
            dataKey="ads" 
            stroke="hsl(var(--primary))" 
            fillOpacity={1} 
            fill="url(#colorAds)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

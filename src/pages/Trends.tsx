import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";

interface NicheTrend {
  id: string;
  name: string;
  velocity: number;
  velocityChange: "up" | "down" | "stable";
  saturation: "low" | "medium" | "high";
  newAds7d: number;
  topAdvertisers: string[];
}

const trends: NicheTrend[] = [
  {
    id: "1",
    name: "AI Writing Tools",
    velocity: 340,
    velocityChange: "up",
    saturation: "low",
    newAds7d: 1247,
    topAdvertisers: ["WriteAI Pro", "ContentGenius", "CopyMaster AI"],
  },
  {
    id: "2",
    name: "Weight Loss Supplements",
    velocity: 89,
    velocityChange: "down",
    saturation: "high",
    newAds7d: 892,
    topAdvertisers: ["FitLife Pro", "SlimTech", "Natural Health Store"],
  },
  {
    id: "3",
    name: "Crypto Trading Courses",
    velocity: 156,
    velocityChange: "up",
    saturation: "medium",
    newAds7d: 567,
    topAdvertisers: ["Crypto Wealth Academy", "BitTrader Pro", "CoinMaster"],
  },
  {
    id: "4",
    name: "Home Fitness Equipment",
    velocity: 12,
    velocityChange: "stable",
    saturation: "high",
    newAds7d: 234,
    topAdvertisers: ["GymPro", "FitHome", "StrengthMaster"],
  },
  {
    id: "5",
    name: "Mental Health Apps",
    velocity: 278,
    velocityChange: "up",
    saturation: "low",
    newAds7d: 445,
    topAdvertisers: ["CalmMind", "MindfulAI", "TherapyBot"],
  },
];

const velocityIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const saturationColors = {
  low: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  high: "text-destructive bg-destructive/10 border-destructive/20",
};

export default function Trends() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Niche Trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Market velocity and saturation analysis
        </p>
      </div>

      {/* Emerging Alert */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 glow-primary">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Emerging Niche Alert</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          "AI Writing Tools" showing 340% velocity increase with low saturation — high opportunity window
        </p>
      </div>

      {/* Trends Table */}
      <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Niche</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Velocity</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Saturation</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">New Ads (7d)</th>
              <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Advertisers</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend) => {
              const VelocityIcon = velocityIcons[trend.velocityChange];
              return (
                <tr key={trend.id} className="data-table-row group cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{trend.name}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <VelocityIcon className={`h-4 w-4 ${
                        trend.velocityChange === "up" ? "text-success" :
                        trend.velocityChange === "down" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                      <span className={`text-sm font-medium tabular-nums ${
                        trend.velocityChange === "up" ? "text-success" :
                        trend.velocityChange === "down" ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {trend.velocity}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={`text-xs font-normal capitalize ${saturationColors[trend.saturation]}`}>
                      {trend.saturation}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm tabular-nums text-muted-foreground">{trend.newAds7d.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {trend.topAdvertisers.slice(0, 2).map((advertiser, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {advertiser}
                        </Badge>
                      ))}
                      {trend.topAdvertisers.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{trend.topAdvertisers.length - 2}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

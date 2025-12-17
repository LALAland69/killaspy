import { ScoreBadge } from "./ScoreBadge";
import { Eye, AlertTriangle, TrendingUp } from "lucide-react";

interface Activity {
  id: string;
  type: "divergence" | "alert" | "trend";
  title: string;
  description: string;
  time: string;
  score?: number;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "divergence",
    title: "Content Divergence Detected",
    description: "cryptowealthacademy.io showing different landing page from US vs EU",
    time: "2 min ago",
    score: 92,
  },
  {
    id: "2",
    type: "alert",
    title: "High Rotation Velocity",
    description: "FitLife Pro created 15 new ads in 24 hours",
    time: "15 min ago",
  },
  {
    id: "3",
    type: "trend",
    title: "Emerging Niche Detected",
    description: "AI Writing Tools category showing 340% growth",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "divergence",
    title: "Redirect Chain Anomaly",
    description: "financefreedom.co using 5-hop redirect chain",
    time: "2 hours ago",
    score: 67,
  },
];

const iconMap = {
  divergence: Eye,
  alert: AlertTriangle,
  trend: TrendingUp,
};

export function RecentActivity() {
  return (
    <div className="rounded-lg border border-border/50 bg-card">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border/50">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div key={activity.id} className="flex items-start gap-3 px-5 py-4 hover:bg-surface-hover transition-colors">
              <div className="mt-0.5 rounded-md bg-secondary p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.score && <ScoreBadge score={activity.score} />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{activity.description}</p>
                <p className="mt-1 text-xs text-muted-foreground/60">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

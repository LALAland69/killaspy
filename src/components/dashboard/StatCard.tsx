import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  highlight?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon: Icon,
  highlight 
}: StatCardProps) {
  return (
    <div className={cn(
      "stat-card",
      highlight && "border-primary/30 glow-primary"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-semibold tracking-tight",
            highlight && "text-primary"
          )}>
            {value}
          </p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-secondary p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

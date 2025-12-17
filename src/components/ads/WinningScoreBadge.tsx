import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, Zap, FlaskConical } from "lucide-react";
import type { WinningScore } from "@/hooks/useWinningAds";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WinningScoreBadgeProps {
  score: WinningScore;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WinningScoreBadge({ score, showLabel = false, size = "md" }: WinningScoreBadgeProps) {
  const getTierStyles = () => {
    switch (score.tier) {
      case "champion":
        return {
          bg: "bg-yellow-500/20 border-yellow-500/50",
          text: "text-yellow-500",
          icon: Trophy,
          label: "Champion",
        };
      case "strong":
        return {
          bg: "bg-green-500/20 border-green-500/50",
          text: "text-green-500",
          icon: TrendingUp,
          label: "Strong",
        };
      case "promising":
        return {
          bg: "bg-blue-500/20 border-blue-500/50",
          text: "text-blue-500",
          icon: Zap,
          label: "Promising",
        };
      case "testing":
        return {
          bg: "bg-secondary border-border/50",
          text: "text-muted-foreground",
          icon: FlaskConical,
          label: "Testing",
        };
    }
  };

  const styles = getTierStyles();
  const Icon = styles.icon;
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2 py-1 text-sm gap-1.5",
    lg: "px-3 py-1.5 text-base gap-2",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-md border font-medium",
              styles.bg,
              styles.text,
              sizeClasses[size]
            )}
          >
            <Icon className={iconSizes[size]} />
            <span className="font-semibold">{score.total}</span>
            {showLabel && <span className="font-normal">{styles.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{styles.label} Ad ({score.total}/100)</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Longevidade (60%)</span>
                <span>{score.longevityScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engagement (40%)</span>
                <span>{score.engagementScore}/100</span>
              </div>
            </div>
            {score.isWinner && (
              <p className="text-xs text-green-500 border-t border-border pt-2">
                ✓ Anúncio vencedor validado pelo mercado
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function ScoreBadge({ score, showLabel = false }: ScoreBadgeProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 61) {
      return {
        label: "HIGH PROBABILITY",
        className: "score-badge-high",
      };
    }
    if (score >= 31) {
      return {
        label: "Medium Risk",
        className: "score-badge-medium",
      };
    }
    return {
      label: "Low Risk",
      className: "score-badge-low",
    };
  };

  const config = getScoreConfig(score);

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
      config.className
    )}>
      <span className="tabular-nums">{score}%</span>
      {showLabel && <span className="hidden sm:inline">· {config.label}</span>}
    </div>
  );
}

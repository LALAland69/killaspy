import { useTriggerScheduledWorker } from "@/hooks/useScheduledWorker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, RefreshCw, History } from "lucide-react";
import { Link } from "react-router-dom";

const SCHEDULES = [
  {
    id: "daily-divergence",
    name: "Daily Divergence Test",
    description: "Tests all active ads for cloaking behavior",
    schedule: "2:00 AM UTC",
    taskType: "divergence_test" as const,
    scheduleType: "daily" as const,
  },
  {
    id: "intraday-divergence",
    name: "Intraday High-Risk Test",
    description: "Monitors high-suspicion ads every 4 hours",
    schedule: "Every 4 hours",
    taskType: "divergence_test" as const,
    scheduleType: "intraday" as const,
  },
  {
    id: "daily-status",
    name: "Daily Status Check",
    description: "Verifies ad landing page availability",
    schedule: "6:00 AM UTC",
    taskType: "status_check" as const,
    scheduleType: "daily" as const,
  },
];

export function ScheduledWorkersPanel() {
  const triggerWorker = useTriggerScheduledWorker();

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Scheduled Workers
          </CardTitle>
          <Link to="/jobs">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <History className="h-3 w-3" />
              History
            </Button>
          </Link>
        </div>
        <CardDescription className="text-xs">
          Automated tasks for ad monitoring and divergence detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {SCHEDULES.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{schedule.name}</span>
                <Badge variant="outline" className="text-xs">
                  {schedule.schedule}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{schedule.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                triggerWorker.mutate({
                  taskType: schedule.taskType,
                  scheduleType: schedule.scheduleType,
                })
              }
              disabled={triggerWorker.isPending}
              className="gap-1.5"
            >
              {triggerWorker.isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              Run Now
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

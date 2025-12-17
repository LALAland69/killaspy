import { DomainsTable } from "@/components/domains/DomainsTable";
import { Input } from "@/components/ui/input";
import { Search, Globe } from "lucide-react";

export default function Domains() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze domain infrastructure, tech stack, and funnel structure
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search domains..." 
            className="pl-9 bg-secondary border-border/50"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Domains</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">--</p>
        </div>
        <div className="stat-card border-primary/30 glow-primary">
          <p className="text-sm text-muted-foreground">High Risk</p>
          <p className="mt-1 text-2xl font-semibold text-primary">--</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Sales Pages</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">--</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Unique Tech Stacks</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">--</p>
        </div>
      </div>

      {/* Table */}
      <DomainsTable />
    </div>
  );
}

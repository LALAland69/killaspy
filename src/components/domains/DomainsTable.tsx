import { useDomains } from "@/hooks/useDomains";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ExternalLink, FileText, ShoppingCart, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function DomainsTable() {
  const { data: domains, isLoading, error } = useDomains();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
        Failed to load domains
      </div>
    );
  }

  if (!domains || domains.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
        <Globe className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">No domains found</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Seed demo data to see example domains</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-secondary/30">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Domain</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tech Stack</th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Pages</th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Sales</th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Compliance</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {domains.map((domain) => (
            <tr key={domain.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Link 
                      to={`/domains/${domain.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {domain.domain}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {domain.advertiser_id ? "Linked to advertiser" : "No advertiser"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {domain.tech_stack?.slice(0, 3).map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  )) || <span className="text-xs text-muted-foreground">Unknown</span>}
                  {(domain.tech_stack?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(domain.tech_stack?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{domain.page_count || 0}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-primary">{domain.sales_pages || 0}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{domain.compliance_pages || 0}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <ScoreBadge score={domain.suspicion_score || 0} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

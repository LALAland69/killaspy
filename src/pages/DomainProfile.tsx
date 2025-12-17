import { useParams, Link } from "react-router-dom";
import { useDomain, useDomainPages, useDomainAds, useDomainAdvertiser } from "@/hooks/useDomains";
import { AdsTable } from "@/components/ads/AdsTable";
import { TechStackChart } from "@/components/domains/TechStackChart";
import { FunnelAnalysisChart } from "@/components/domains/FunnelAnalysisChart";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Globe, FileText, ShoppingCart, Shield, 
  ExternalLink, Code, Users, Loader2, CreditCard, MessageSquare
} from "lucide-react";

export default function DomainProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: domain, isLoading: domainLoading } = useDomain(id!);
  const { data: pages, isLoading: pagesLoading } = useDomainPages(id!);
  const { data: ads, isLoading: adsLoading } = useDomainAds(id!);
  const { data: advertiser } = useDomainAdvertiser(domain?.advertiser_id || null);

  if (domainLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Domain not found</p>
        <Link to="/domains" className="text-primary hover:text-primary/80">
          ← Back to Domains
        </Link>
      </div>
    );
  }

  const riskLevel = (domain.suspicion_score || 0) >= 70 ? "High" : (domain.suspicion_score || 0) >= 40 ? "Medium" : "Low";
  const riskColor = riskLevel === "High" ? "destructive" : riskLevel === "Medium" ? "secondary" : "outline";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link 
        to="/domains" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Domains
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{domain.domain}</h1>
            <a 
              href={`https://${domain.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          {advertiser && (
            <Link 
              to={`/advertisers/${advertiser.id}`}
              className="mt-1 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              {advertiser.name}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={riskColor as any}>{riskLevel} Risk</Badge>
          <ScoreBadge score={domain.suspicion_score || 0} showLabel />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{domain.page_count || 0}</p>
                <p className="text-xs text-muted-foreground">Total Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary">{domain.sales_pages || 0}</p>
                <p className="text-xs text-muted-foreground">Sales Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{domain.compliance_pages || 0}</p>
                <p className="text-xs text-muted-foreground">Compliance Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Code className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{domain.tech_stack?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Tech Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <TechStackChart techStack={domain.tech_stack || []} />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Funnel Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelAnalysisChart 
              salesPages={domain.sales_pages || 0} 
              compliancePages={domain.compliance_pages || 0}
              totalPages={domain.page_count || 0}
            />
          </CardContent>
        </Card>
      </div>

      {/* Pages List */}
      {pagesLoading ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : pages && pages.length > 0 ? (
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Domain Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pages.map((page) => (
                <div 
                  key={page.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <a 
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate"
                    >
                      {page.url}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <Badge variant={
                        page.page_classification === "sales" ? "default" :
                        page.page_classification === "compliance" ? "secondary" : "outline"
                      } className="text-xs">
                        {page.page_classification || "Unknown"}
                      </Badge>
                      {page.has_payment_button && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Payment
                        </span>
                      )}
                      {page.has_testimonials && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Testimonials
                        </span>
                      )}
                    </div>
                  </div>
                  {page.tech_stack_detected && page.tech_stack_detected.length > 0 && (
                    <div className="flex gap-1 ml-4">
                      {page.tech_stack_detected.slice(0, 2).map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No pages crawled for this domain yet</p>
          </CardContent>
        </Card>
      )}

      {/* Ads Table */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-foreground">Ads pointing to {domain.domain}</h2>
        <AdsTable ads={ads as any} isLoading={adsLoading} />
      </div>
    </div>
  );
}

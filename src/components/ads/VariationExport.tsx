import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { useAdVariations } from "@/hooks/useAdVariations";

export function VariationExport() {
  const { variationGroups, stats } = useAdVariations();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const headers = [
        "Group ID",
        "Advertiser",
        "Base Headline",
        "Variation Count",
        "Text Similarity %",
        "Performance Rank",
        "Avg Engagement",
        "Avg Longevity",
        "Best Performer Score",
        "Has Visual Variations",
        "Ad ID",
        "Headline",
        "Primary Text",
        "CTA",
        "Status",
        "Start Date",
        "Engagement Score",
        "Longevity Days",
        "Performance Score",
        "Suspicion Score",
      ];

      const rows: string[][] = [];

      variationGroups.forEach((group) => {
        group.ads.forEach((ad, index) => {
          rows.push([
            group.groupId,
            group.page_name || "Unknown",
            group.baseHeadline || "",
            index === 0 ? group.variationCount.toString() : "",
            index === 0 ? group.similarity.toString() : "",
            index === 0 ? group.performance.performanceRank : "",
            index === 0 ? group.performance.avgEngagement.toString() : "",
            index === 0 ? group.performance.avgLongevity.toString() : "",
            index === 0 ? group.performance.bestPerformerScore.toString() : "",
            index === 0 ? (group.hasVisualVariations ? "Yes" : "No") : "",
            ad.id,
            ad.headline || "",
            ad.primary_text || "",
            ad.cta || "",
            ad.status || "",
            ad.start_date || "",
            ad.engagement_score?.toString() || "",
            ad.longevity_days?.toString() || "",
            ad.performanceScore.toString(),
            ad.suspicion_score?.toString() || "",
          ]);
        });
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ad-variations-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Export successful",
        description: `Exported ${variationGroups.length} variation groups to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export variation data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    
    try {
      // Generate HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ad Variations Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a2e; }
    h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #1e293b; margin-top: 30px; }
    .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .summary-item { text-align: center; }
    .summary-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .summary-label { font-size: 12px; color: #64748b; }
    .group { border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; overflow: hidden; }
    .group-header { background: #f1f5f9; padding: 15px; border-bottom: 1px solid #e2e8f0; }
    .group-title { font-weight: 600; margin: 0; }
    .group-meta { font-size: 12px; color: #64748b; margin-top: 5px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 8px; }
    .badge-high { background: #dcfce7; color: #166534; }
    .badge-medium { background: #fef9c3; color: #854d0e; }
    .badge-low { background: #f3f4f6; color: #4b5563; }
    .variations { padding: 15px; }
    .variation { background: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
    .variation-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .variation-rank { font-weight: 600; color: #3b82f6; }
    .variation-score { font-size: 12px; color: #64748b; }
    .variation-headline { font-weight: 500; margin-bottom: 4px; }
    .variation-text { font-size: 13px; color: #64748b; }
    .metrics { display: flex; gap: 15px; margin-top: 10px; font-size: 12px; }
    .metric { color: #64748b; }
    .metric-value { font-weight: 600; color: #1e293b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Ad Variations Analysis Report</h1>
  <p style="color: #64748b;">Generated on ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</p>
  
  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">${stats.totalGroups}</div>
        <div class="summary-label">Variation Groups</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${stats.totalDuplicates}</div>
        <div class="summary-label">Total Variations</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${stats.avgVariations}</div>
        <div class="summary-label">Avg per Group</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${stats.highPerformers}</div>
        <div class="summary-label">High Performers</div>
      </div>
    </div>
  </div>

  <h2>Variation Groups</h2>
  ${variationGroups.map((group) => `
    <div class="group">
      <div class="group-header">
        <p class="group-title">${group.page_name || 'Unknown Advertiser'}</p>
        <div class="group-meta">
          <span class="badge badge-${group.performance.performanceRank}">${group.performance.performanceRank.toUpperCase()}</span>
          ${group.variationCount} variations • ${group.similarity}% text similarity
          ${group.hasVisualVariations ? ' • Visual variations detected' : ''}
        </div>
      </div>
      <div class="variations">
        ${[...group.ads]
          .sort((a, b) => b.performanceScore - a.performanceScore)
          .map((ad, index) => `
            <div class="variation">
              <div class="variation-header">
                <span class="variation-rank">#${index + 1} ${ad.id === group.performance.bestPerformerId ? '⭐ Best' : ''}</span>
                <span class="variation-score">Score: ${ad.performanceScore}</span>
              </div>
              ${ad.headline ? `<div class="variation-headline">${ad.headline}</div>` : ''}
              ${ad.primary_text ? `<div class="variation-text">${ad.primary_text.substring(0, 150)}${ad.primary_text.length > 150 ? '...' : ''}</div>` : ''}
              <div class="metrics">
                <span class="metric">Engagement: <span class="metric-value">${ad.engagement_score ?? 'N/A'}</span></span>
                <span class="metric">Longevity: <span class="metric-value">${ad.longevity_days ?? 'N/A'}d</span></span>
                <span class="metric">Status: <span class="metric-value">${ad.status || 'N/A'}</span></span>
                ${ad.cta ? `<span class="metric">CTA: <span class="metric-value">${ad.cta}</span></span>` : ''}
              </div>
            </div>
          `).join('')}
      </div>
    </div>
  `).join('')}

  <div class="footer">
    <p>KillaSpy - Ad Intelligence Platform</p>
    <p>This report contains confidential competitive intelligence data.</p>
  </div>
</body>
</html>`;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({
        title: "Report generated",
        description: "PDF report opened in new window. Use browser print to save as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSummaryJSON = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        generatedAt: new Date().toISOString(),
        summary: stats,
        groups: variationGroups.map((group) => ({
          groupId: group.groupId,
          advertiser: group.page_name,
          baseHeadline: group.baseHeadline,
          variationCount: group.variationCount,
          similarity: group.similarity,
          performance: group.performance,
          hasVisualVariations: group.hasVisualVariations,
          ads: group.ads.map((ad) => ({
            id: ad.id,
            headline: ad.headline,
            primaryText: ad.primary_text,
            cta: ad.cta,
            status: ad.status,
            startDate: ad.start_date,
            engagementScore: ad.engagement_score,
            longevityDays: ad.longevity_days,
            performanceScore: ad.performanceScore,
            suspicionScore: ad.suspicion_score,
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ad-variations-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: "Export successful",
        description: "Exported variation data as JSON",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export JSON data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || variationGroups.length === 0}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportSummaryJSON}>
          <Download className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

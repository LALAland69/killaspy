import { AdsTable } from "@/components/ads/AdsTable";
import { AdVariationsPanel } from "@/components/ads/AdVariationsPanel";
import { VariationPerformanceCharts } from "@/components/ads/VariationPerformanceCharts";
import { VariationExport } from "@/components/ads/VariationExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Download, Table2, Copy, TrendingUp } from "lucide-react";

export default function Ads() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Ads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse and analyze tracked advertisements</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Table2 className="h-4 w-4" />
            All Ads
          </TabsTrigger>
          <TabsTrigger value="variations" className="gap-2">
            <Copy className="h-4 w-4" />
            Creative Variations
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search ads..."
              className="h-9 w-64 bg-secondary/50"
            />
            <Select>
              <SelectTrigger className="h-9 w-32 bg-secondary/50">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="au">Australia</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-9 w-32 bg-secondary/50">
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-9 w-32 bg-secondary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="h-9 w-36 bg-secondary/50">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Risk (61-100)</SelectItem>
                <SelectItem value="medium">Medium Risk (31-60)</SelectItem>
                <SelectItem value="low">Low Risk (0-30)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>

          {/* Table */}
          <AdsTable />

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">Showing 1-5 of 12,847 ads</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          <div className="flex justify-end">
            <VariationExport />
          </div>
          <AdVariationsPanel />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="flex justify-end">
            <VariationExport />
          </div>
          <VariationPerformanceCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}

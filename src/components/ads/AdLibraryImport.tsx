import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, Loader2, ExternalLink, X } from "lucide-react";
import { useAdLibrarySearch, useAdLibraryImport } from "@/hooks/useAdLibraryImport";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
];

export function AdLibraryImport() {
  const [searchTerms, setSearchTerms] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"]);
  const [activeStatus, setActiveStatus] = useState("ACTIVE");
  const [limit, setLimit] = useState(25);

  const { search, isSearching, previews, clearPreviews } = useAdLibrarySearch();
  const { importAds, isImporting } = useAdLibraryImport();

  const handleSearch = () => {
    if (!searchTerms.trim()) return;
    
    search({
      search_terms: searchTerms,
      ad_reached_countries: selectedCountries,
      ad_active_status: activeStatus,
      limit,
    });
  };

  const handleImport = () => {
    if (!searchTerms.trim()) return;
    
    importAds({
      search_terms: searchTerms,
      ad_reached_countries: selectedCountries,
      ad_active_status: activeStatus,
      limit,
    });
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Facebook Ad Library Import
          </CardTitle>
          <CardDescription>
            Search and import ads from Facebook Ad Library to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search Terms</Label>
              <Input
                id="search"
                placeholder="e.g., weight loss, crypto, dropshipping"
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label>Ad Status</Label>
              <Select value={activeStatus} onValueChange={setActiveStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  <SelectItem value="ALL">All Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Countries</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((country) => (
                <Badge
                  key={country.code}
                  variant={selectedCountries.includes(country.code) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCountry(country.code)}
                >
                  {country.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Results Limit: {limit}</Label>
            <Input
              type="range"
              min={10}
              max={100}
              step={5}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isSearching || !searchTerms.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Preview Results
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !searchTerms.trim()}
              variant="secondary"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Import Directly
            </Button>
          </div>
        </CardContent>
      </Card>

      {previews.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview Results ({previews.length})</CardTitle>
              <CardDescription>Review ads before importing</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={clearPreviews}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button size="sm" onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Import All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {previews.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {ad.page_name || 'Unknown Page'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ad.page_id}
                          </Badge>
                        </div>
                        {ad.headline && (
                          <p className="text-sm font-medium text-foreground mb-1">
                            {ad.headline}
                          </p>
                        )}
                        {ad.primary_text && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ad.primary_text}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {ad.start_date && (
                            <span>Started: {new Date(ad.start_date).toLocaleDateString()}</span>
                          )}
                          {ad.end_date && (
                            <span>• Ended: {new Date(ad.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      {ad.snapshot_url && (
                        <a
                          href={ad.snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

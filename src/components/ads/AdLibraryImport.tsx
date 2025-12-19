import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Download, Loader2, ExternalLink, X, Plus, Trash2, Clock, Target, AlertCircle, RefreshCw, Info } from "lucide-react";
import { useAdLibrarySearch, useAdLibraryImport, FacebookApiError } from "@/hooks/useAdLibraryImport";
import { useImportSchedules, useCreateSchedule, useToggleSchedule, useDeleteSchedule } from "@/hooks/useImportSchedules";
import { formatDistanceToNow } from "date-fns";
import { FacebookApiStatusBadge } from "./FacebookApiStatusBadge";

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

// Enhanced Error Alert Component with better UX
function ApiErrorAlert({
  error,
  onRetry,
  isRetrying,
}: {
  error: FacebookApiError;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  const isTransientError = !!error.isTransient;

  return (
    <Alert variant={isTransientError ? "default" : "destructive"} className="mt-4">
      <AlertCircle className={`h-5 w-5 ${isTransientError ? "text-muted-foreground" : "text-destructive"}`} />
      <AlertTitle className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isTransientError ? "text-foreground" : "text-destructive"}`}>
            {isTransientError ? "API do Facebook instável" : "Erro na API do Facebook"}
          </span>
          {isTransientError && (
            <Badge variant="secondary" className="text-xs">
              Temporário
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying} className="h-7">
            {isRetrying ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Tentar novamente
          </Button>

          <Button size="sm" variant="ghost" asChild className="h-7">
            <a href="/health">
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver status
            </a>
          </Button>
        </div>
      </AlertTitle>

      <AlertDescription className="mt-3 space-y-3">
        {isTransientError ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="p-2 rounded-full bg-background/60 border border-border">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                O Facebook está retornando erros intermitentes
              </p>
              <p className="text-xs text-muted-foreground">
                Aguarde alguns minutos e tente novamente. O sistema já faz tentativas automáticas com backoff.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="p-2 rounded-full bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                {error.message || "Ocorreu um erro ao conectar com a API do Facebook"}
              </p>
              {error.suggestion && <p className="text-xs text-muted-foreground">{error.suggestion}</p>}
            </div>
          </div>
        )}

        {error.fbtrace_id && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Detalhes técnicos
            </summary>
            <div className="mt-2 p-2 rounded bg-muted/50 border border-border font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Facebook Trace ID:</span>
                <code className="text-foreground select-all">{error.fbtrace_id}</code>
              </div>
            </div>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function AdLibraryImport() {
  const [searchTerms, setSearchTerms] = useState("");
  const [pageIds, setPageIds] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"]);
  const [activeStatus, setActiveStatus] = useState("ACTIVE");
  const [limit, setLimit] = useState(25);
  const [scheduleName, setScheduleName] = useState("");

  const { search, isSearching, previews, clearPreviews, lastError: searchError, retryInfo: searchRetryInfo } = useAdLibrarySearch();
  const { importAds, isImporting, lastError: importError, retryInfo: importRetryInfo } = useAdLibraryImport();
  const { data: schedules, isLoading: schedulesLoading } = useImportSchedules();
  const createSchedule = useCreateSchedule();
  const toggleSchedule = useToggleSchedule();
  const deleteSchedule = useDeleteSchedule();
  
  // Combine errors and retry info
  const apiError = searchError || importError;
  const retryInfo = searchRetryInfo || importRetryInfo;

  const getSearchParams = () => ({
    search_terms: searchTerms.trim() || undefined,
    search_page_ids: pageIds.trim() ? pageIds.split(",").map(id => id.trim()).filter(Boolean) : undefined,
    ad_reached_countries: selectedCountries,
    ad_active_status: activeStatus,
    limit,
  });

  const handleSearch = () => {
    const params = getSearchParams();
    if (!params.search_terms && !params.search_page_ids?.length) {
      return;
    }
    search(params);
  };

  const handleImport = () => {
    const params = getSearchParams();
    if (!params.search_terms && !params.search_page_ids?.length) {
      return;
    }
    importAds(params);
  };

  const handleCreateSchedule = () => {
    const params = getSearchParams();
    if (!scheduleName.trim()) return;
    if (!params.search_terms && !params.search_page_ids?.length) return;

    createSchedule.mutate({
      name: scheduleName,
      search_terms: params.search_terms,
      search_page_ids: params.search_page_ids,
      ad_reached_countries: params.ad_reached_countries,
      ad_active_status: params.ad_active_status,
      import_limit: params.limit,
    });
    setScheduleName("");
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const canSearch = searchTerms.trim() || pageIds.trim();

  return (
    <Tabs defaultValue="import" className="space-y-6">
      <TabsList>
        <TabsTrigger value="import">Manual Import</TabsTrigger>
        <TabsTrigger value="schedules">Scheduled Imports</TabsTrigger>
      </TabsList>

      <TabsContent value="import" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Facebook Ad Library Import
                </CardTitle>
                <CardDescription>
                  Search and import ads from Facebook Ad Library to analyze
                </CardDescription>
              </div>
              <FacebookApiStatusBadge />
            </div>
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
                <Label htmlFor="pageIds" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Page IDs (Competitor Tracking)
                </Label>
                <Input
                  id="pageIds"
                  placeholder="e.g., 123456789, 987654321"
                  value={pageIds}
                  onChange={(e) => setPageIds(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated Facebook Page IDs to track specific competitors
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ad Status</Label>
              <Select value={activeStatus} onValueChange={setActiveStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  <SelectItem value="ALL">All Ads</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSearch} disabled={isSearching || !canSearch}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Preview Results
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || !canSearch}
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

            {/* Retry Progress Indicator */}
            {retryInfo && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Tentativa {retryInfo.attempt} de {retryInfo.maxRetries}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Erro temporário do Facebook. Tentando novamente automaticamente...
                  </p>
                </div>
              </div>
            )}

            {/* Error Display with Details */}
            {apiError && !retryInfo && (
              <ApiErrorAlert
                error={apiError}
                onRetry={importError ? handleImport : handleSearch}
                isRetrying={isSearching || isImporting}
              />
            )}

            {/* Save as Schedule */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Save current settings as a scheduled import
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Schedule name (e.g., Daily Competitor Check)"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateSchedule}
                  disabled={!scheduleName.trim() || !canSearch || createSchedule.isPending}
                  variant="outline"
                >
                  {createSchedule.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Save Schedule
                </Button>
              </div>
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
      </TabsContent>

      <TabsContent value="schedules" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Imports
            </CardTitle>
            <CardDescription>
              Automatic daily imports run at 3:00 AM UTC for all active schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : schedules?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No scheduled imports yet</p>
                <p className="text-sm">Create one from the Manual Import tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules?.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{schedule.name}</span>
                          <Badge variant={schedule.is_active ? "default" : "secondary"}>
                            {schedule.is_active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {schedule.search_terms && (
                            <p>Search: "{schedule.search_terms}"</p>
                          )}
                          {schedule.search_page_ids?.length > 0 && (
                            <p>Page IDs: {schedule.search_page_ids.join(", ")}</p>
                          )}
                          <p>
                            Countries: {schedule.ad_reached_countries?.join(", ")} • 
                            Status: {schedule.ad_active_status} • 
                            Limit: {schedule.import_limit}
                          </p>
                          {schedule.last_run_at && (
                            <p className="text-xs">
                              Last run: {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={(checked) => 
                            toggleSchedule.mutate({ id: schedule.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule.mutate(schedule.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

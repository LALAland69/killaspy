import { useState } from "react";
import { useLogs, LogLevel, LogEntry } from "@/lib/logger";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Trash2, 
  Search, 
  AlertTriangle, 
  Info, 
  Bug, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const levelIcons: Record<LogLevel, React.ReactNode> = {
  debug: <Bug className="h-4 w-4 text-muted-foreground" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
  warn: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const levelColors: Record<LogLevel, string> = {
  debug: 'bg-muted text-muted-foreground',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warn: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function LogsPage() {
  const { t } = useLanguage();
  const { logs, clearLogs, exportJSON, exportCSV } = useLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get unique categories
  const categories = Array.from(new Set(logs.map(log => log.category)));

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    
    return matchesSearch && matchesLevel && matchesCategory;
  }).reverse(); // Most recent first

  const handleExport = (format: 'json' | 'csv') => {
    const content = format === 'json' ? exportJSON() : exportCSV();
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `killaspy-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Logs exported as ${format.toUpperCase()}`);
  };

  const handleClear = () => {
    clearLogs();
    toast.success('Logs cleared');
  };

  // Stats
  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;
  const infoCount = logs.filter(l => l.level === 'info').length;

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('logs.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {logs.length} total entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('logs.clear')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-muted">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{errorCount}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{warnCount}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{infoCount}</p>
                <p className="text-xs text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | "all")}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t('logs.timestamp')}</TableHead>
                  <TableHead className="w-[100px]">{t('logs.level')}</TableHead>
                  <TableHead className="w-[120px]">{t('logs.category')}</TableHead>
                  <TableHead>{t('logs.message')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                        <br />
                        <span className="text-[10px]">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={levelColors[log.level]}>
                          <span className="mr-1">{levelIcons[log.level]}</span>
                          {log.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[400px]">
                          <p className="text-sm truncate">{log.message}</p>
                          {log.data && (
                            <pre className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded overflow-x-auto max-h-20 hidden group-hover:block">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}

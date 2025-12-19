import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Grid3X3, 
  ArrowUpDown, 
  CalendarIcon, 
  Image as ImageIcon,
  Globe,
  Flag,
  Languages,
  Monitor,
  AlertTriangle,
  Trophy
} from "lucide-react";
import type { AdCategory } from "@/hooks/useAdCategories";
import type { AdsFilters } from "@/hooks/useAds";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface AdsFiltersBarProps {
  filters: AdsFilters;
  onFiltersChange: (filters: AdsFilters) => void;
  categories: AdCategory[];
}

const COUNTRIES = [
  { code: "BR", name: "🇧🇷 Brasil" },
  { code: "all", name: "Todos os Países" },
  { code: "US", name: "🇺🇸 Estados Unidos" },
  { code: "UK", name: "🇬🇧 Reino Unido" },
  { code: "CA", name: "🇨🇦 Canadá" },
  { code: "AU", name: "🇦🇺 Austrália" },
  { code: "DE", name: "🇩🇪 Alemanha" },
  { code: "FR", name: "🇫🇷 França" },
  { code: "ES", name: "🇪🇸 Espanha" },
  { code: "IT", name: "🇮🇹 Itália" },
  { code: "MX", name: "🇲🇽 México" },
  { code: "PT", name: "🇵🇹 Portugal" },
];

const LANGUAGES = [
  { code: "all", name: "Todos os Idiomas" },
  { code: "pt", name: "Português" },
  { code: "en", name: "Inglês" },
  { code: "es", name: "Espanhol" },
  { code: "de", name: "Alemão" },
  { code: "fr", name: "Francês" },
  { code: "it", name: "Italiano" },
];

const DATE_RANGES = [
  { value: "all", label: "Todo Período" },
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "thisMonth", label: "Este Mês" },
  { value: "lastMonth", label: "Mês Passado" },
  { value: "custom", label: "Personalizado" },
];

export function AdsFiltersBar({ filters, onFiltersChange, categories }: AdsFiltersBarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const updateFilter = (key: keyof AdsFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Categories, Search, Sort, Date Range, Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Categories */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Grid3X3 className="h-3.5 w-3.5" />
            Categoria
          </label>
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name} ({cat.ads_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Pesquisar
          </label>
          <div className="flex gap-2">
            <Select value={filters.searchBy} onValueChange={(v) => updateFilter("searchBy", v)}>
              <SelectTrigger className="h-9 w-28 bg-background border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">Tudo</SelectItem>
                <SelectItem value="headline">Headline</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="page">Página</SelectItem>
                <SelectItem value="domain">Domínio</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                placeholder="Buscar ads..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="h-9 bg-background border-border/50"
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar
          </label>
          <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="winning">🏆 Winning Score</SelectItem>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="oldest">Mais Antigos</SelectItem>
              <SelectItem value="score_high">Maior Score</SelectItem>
              <SelectItem value="score_low">Menor Score</SelectItem>
              <SelectItem value="longevity">Maior Longevidade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            Período
          </label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="h-9 w-full justify-start text-left font-normal bg-background border-border/50"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {DATE_RANGES.find(d => d.value === filters.dateRange)?.label || "Todo Período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
              <div className="p-2 space-y-1 border-b border-border">
                {DATE_RANGES.map((range) => (
                  <Button
                    key={range.value}
                    variant={filters.dateRange === range.value ? "secondary" : "ghost"}
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => {
                      updateFilter("dateRange", range.value);
                      if (range.value !== "custom") setDatePickerOpen(false);
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              {filters.dateRange === "custom" && (
                <Calendar
                  mode="range"
                  className="p-3"
                  locale={ptBR}
                />
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 2: Country, Language, Platform, Status, Media, Risk Level */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            País
          </label>
          <Select value={filters.country} onValueChange={(v) => updateFilter("country", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Languages className="h-3.5 w-3.5" />
            Idioma
          </label>
          <Select value={filters.language} onValueChange={(v) => updateFilter("language", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5" />
            Plataforma
          </label>
          <Select value={filters.platform} onValueChange={(v) => updateFilter("platform", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="messenger">Messenger</SelectItem>
              <SelectItem value="audience_network">Audience Network</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Status
          </label>
          <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Media Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Mídia
          </label>
          <Select value={filters.mediaType} onValueChange={(v) => updateFilter("mediaType", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="image">Imagem</SelectItem>
              <SelectItem value="carousel">Carrossel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Risk Level */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risco
          </label>
          <Select value={filters.riskLevel} onValueChange={(v) => updateFilter("riskLevel", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="high">Alto (61-100)</SelectItem>
              <SelectItem value="medium">Médio (31-60)</SelectItem>
              <SelectItem value="low">Baixo (0-30)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Winning Ads Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" />
            Winning Ads
          </label>
          <Select value={filters.winningTier || "all"} onValueChange={(v) => updateFilter("winningTier", v)}>
            <SelectTrigger className="h-9 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="winners">🏆 Só Vencedores (70+)</SelectItem>
              <SelectItem value="champion">🥇 Champions (85+)</SelectItem>
              <SelectItem value="strong">💪 Strong (70-84)</SelectItem>
              <SelectItem value="promising">📈 Promising (50-69)</SelectItem>
              <SelectItem value="testing">🧪 Testing (0-49)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

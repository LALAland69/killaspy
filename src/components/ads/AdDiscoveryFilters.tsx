import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Filter, X, RotateCcw } from 'lucide-react';

export interface AdFilters {
  country: string | null;
  platform: string | null;
  status: string | null;
  dateFrom: string | null;
  minScore: number | null;
}

interface AdDiscoveryFiltersProps {
  filters: AdFilters;
  onFiltersChange: (filters: AdFilters) => void;
}

const COUNTRIES = [
  { value: 'US', label: 'Estados Unidos' },
  { value: 'BR', label: 'Brasil' },
  { value: 'UK', label: 'Reino Unido' },
  { value: 'CA', label: 'Canadá' },
  { value: 'AU', label: 'Austrália' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'FR', label: 'França' },
  { value: 'ES', label: 'Espanha' },
  { value: 'IT', label: 'Itália' },
  { value: 'PT', label: 'Portugal' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
];

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'audience_network', label: 'Audience Network' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
];

export default function AdDiscoveryFilters({ filters, onFiltersChange }: AdDiscoveryFiltersProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = <K extends keyof AdFilters>(key: K, value: AdFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      country: null,
      platform: null,
      status: null,
      dateFrom: null,
      minScore: null,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const removeFilter = (key: keyof AdFilters) => {
    updateFilter(key, null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Sheet Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros de Anúncios</SheetTitle>
              <SheetDescription>
                Refine sua busca com os filtros abaixo
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Country Filter */}
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={filters.country || ''}
                  onValueChange={(value) => updateFilter('country', value || null)}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Todos os países" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os países</SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select
                  value={filters.platform || ''}
                  onValueChange={(value) => updateFilter('platform', value || null)}
                >
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Todas as plataformas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as plataformas</SelectItem>
                    {PLATFORMS.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => updateFilter('status', value || null)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">A partir de</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || null)}
                />
              </div>

              {/* Score Filter */}
              <div className="space-y-2">
                <Label htmlFor="minScore">Score mínimo</Label>
                <Input
                  id="minScore"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={filters.minScore || ''}
                  onChange={(e) => updateFilter('minScore', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Active Filter Badges */}
        {filters.country && (
          <Badge variant="secondary" className="gap-1">
            {COUNTRIES.find(c => c.value === filters.country)?.label || filters.country}
            <button onClick={() => removeFilter('country')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.platform && (
          <Badge variant="secondary" className="gap-1">
            {PLATFORMS.find(p => p.value === filters.platform)?.label || filters.platform}
            <button onClick={() => removeFilter('platform')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.status && (
          <Badge variant="secondary" className="gap-1">
            {STATUS_OPTIONS.find(s => s.value === filters.status)?.label || filters.status}
            <button onClick={() => removeFilter('status')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.dateFrom && (
          <Badge variant="secondary" className="gap-1">
            A partir de: {filters.dateFrom}
            <button onClick={() => removeFilter('dateFrom')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.minScore && (
          <Badge variant="secondary" className="gap-1">
            Score ≥ {filters.minScore}
            <button onClick={() => removeFilter('minScore')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Limpar todos
          </Button>
        )}
      </div>
    </div>
  );
}

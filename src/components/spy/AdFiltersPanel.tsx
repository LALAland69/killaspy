import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RotateCcw } from "lucide-react";
import type { AdFilters } from "@/pages/AdSpyPage";

interface AdFiltersPanelProps {
  filters: AdFilters;
  onChange: (key: keyof AdFilters, value: any) => void;
  onClear: () => void;
}

export function AdFiltersPanel({ filters, onChange, onClear }: AdFiltersPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros Avançados</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(v) => onChange('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Longevity */}
          <div className="space-y-2">
            <Label>Longevidade mínima: {filters.minLongevity} dias</Label>
            <Slider
              value={[filters.minLongevity]}
              onValueChange={([v]) => onChange('minLongevity', v)}
              min={0}
              max={90}
              step={1}
            />
          </div>

          {/* More countries */}
          <div className="space-y-2">
            <Label>País adicional</Label>
            <Select 
              value={filters.country} 
              onValueChange={(v) => onChange('country', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ES">Espanha</SelectItem>
                <SelectItem value="FR">França</SelectItem>
                <SelectItem value="IT">Itália</SelectItem>
                <SelectItem value="MX">México</SelectItem>
                <SelectItem value="PT">Portugal</SelectItem>
                <SelectItem value="JP">Japão</SelectItem>
                <SelectItem value="IN">Índia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(v) => onChange('sortBy', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="longevity">Maior longevidade</SelectItem>
                <SelectItem value="winning">Winning Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

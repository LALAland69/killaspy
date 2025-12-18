import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useInitializeDefaultCategories,
  useHarvestCategory,
  useFullHarvest,
  AdCategory,
  HarvestMode,
} from "@/hooks/useAdCategories";
import { Plus, Trash2, Edit, Play, Loader2, Tags, Globe, Clock, Database, ChevronDown, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CategoriesManager() {
  const { data: categories, isLoading } = useAdCategories();
  const initializeCategories = useInitializeDefaultCategories();
  const [editingCategory, setEditingCategory] = useState<AdCategory | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria configurada</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Inicialize as categorias padrão para começar a coletar ads automaticamente por nicho.
          </p>
          <Button
            onClick={() => initializeCategories.mutate()}
            disabled={initializeCategories.isPending}
          >
            {initializeCategories.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Inicializar Categorias Padrão
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fullHarvest = useFullHarvest();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categorias de Coleta</h2>
          <p className="text-sm text-muted-foreground">
            Configure as categorias e palavras-chave para coleta automática
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={fullHarvest.isPending}>
                {fullHarvest.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Full Harvest
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fullHarvest.mutate("24h")}>
                <Clock className="h-4 w-4 mr-2" />
                Últimas 24 horas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fullHarvest.mutate("7d")}>
                <Clock className="h-4 w-4 mr-2" />
                Últimos 7 dias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateCategoryDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => setEditingCategory(category)}
          />
        ))}
      </div>

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

function CategoryCard({ category, onEdit }: { category: AdCategory; onEdit: () => void }) {
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const harvestCategory = useHarvestCategory();

  return (
    <Card className={!category.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {category.name}
              <Badge variant="secondary" className="text-xs">
                {category.ads_count} ads
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {category.countries.join(", ")}
              {category.last_harvest_at && (
                <>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(category.last_harvest_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </>
              )}
            </div>
          </div>
          <Switch
            checked={category.is_active}
            onCheckedChange={(checked) =>
              updateCategory.mutate({ id: category.id, is_active: checked })
            }
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {category.keywords.slice(0, 6).map((keyword) => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {category.keywords.length > 6 && (
            <Badge variant="outline" className="text-xs">
              +{category.keywords.length - 6}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={harvestCategory.isPending || !category.is_active}
              >
                {harvestCategory.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span className="ml-1">Coletar</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => harvestCategory.mutate({ categoryId: category.id, mode: "incremental" })}>
                <Clock className="h-4 w-4 mr-2" />
                Incremental (6h)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => harvestCategory.mutate({ categoryId: category.id, mode: "24h" })}>
                <Clock className="h-4 w-4 mr-2" />
                Últimas 24h
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => harvestCategory.mutate({ categoryId: category.id, mode: "7d" })}>
                <Clock className="h-4 w-4 mr-2" />
                Últimos 7 dias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteCategory.mutate(category.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [countries, setCountries] = useState("US,BR");
  const createCategory = useCreateCategory();

  const handleCreate = () => {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const countryList = countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);

    createCategory.mutate(
      { name, slug, keywords: keywordList, countries: countryList },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setKeywords("");
          setCountries("US,BR");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: CBD Products"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex: cbd oil, hemp, cannabidiol"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Países (códigos separados por vírgula)</label>
            <Input
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="Ex: US, BR, UK"
            />
          </div>
          <Button onClick={handleCreate} disabled={createCategory.isPending || !name || !keywords}>
            {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Categoria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({
  category,
  open,
  onClose,
}: {
  category: AdCategory;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [keywords, setKeywords] = useState(category.keywords.join(", "));
  const [countries, setCountries] = useState(category.countries.join(", "));
  const updateCategory = useUpdateCategory();

  const handleUpdate = () => {
    const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const countryList = countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);

    updateCategory.mutate(
      { id: category.id, name, keywords: keywordList, countries: countryList },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Palavras-chave</label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Países</label>
            <Input value={countries} onChange={(e) => setCountries(e.target.value)} />
          </div>
          <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
            {updateCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Search,
  ShoppingCart,
  Code,
  TrendingUp,
  ExternalLink,
  Bookmark,
  Filter,
} from "lucide-react";
import {
  competitiveIntelligenceTools,
  toolCategories,
  getToolsByCategory,
  searchTools,
  type ToolCategory,
  type CompetitiveIntelligenceTool,
} from "@/data/competitiveIntelligenceTools";

const categoryIcons: Record<ToolCategory, React.ReactNode> = {
  'ad-spy': <Eye className="h-4 w-4" />,
  'seo-traffic': <Search className="h-4 w-4" />,
  'ecommerce': <ShoppingCart className="h-4 w-4" />,
  'scraping': <Code className="h-4 w-4" />,
  'market-analysis': <TrendingUp className="h-4 w-4" />,
};

export function ToolsKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");

  const filteredTools = useMemo(() => {
    let tools = competitiveIntelligenceTools;

    if (searchQuery) {
      tools = searchTools(searchQuery);
    }

    if (selectedCategory !== "all") {
      tools = tools.filter(tool => tool.category === selectedCategory);
    }

    return tools;
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: competitiveIntelligenceTools.length };
    Object.keys(toolCategories).forEach(cat => {
      counts[cat] = getToolsByCategory(cat as ToolCategory).length;
    });
    return counts;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Base de Conhecimento CI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          50 ferramentas de inteligência competitiva categorizadas por funcionalidade
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ferramentas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredTools.length} ferramentas
          </span>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`p-3 rounded-lg border text-left transition-colors ${
            selectedCategory === "all"
              ? "bg-primary/10 border-primary"
              : "bg-card hover:bg-accent/5"
          }`}
        >
          <div className="text-lg font-semibold text-primary">{categoryCounts.all}</div>
          <div className="text-xs text-muted-foreground">Todas</div>
        </button>
        {(Object.keys(toolCategories) as ToolCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedCategory === cat
                ? "bg-primary/10 border-primary"
                : "bg-card hover:bg-accent/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {categoryIcons[cat]}
              <span className="text-lg font-semibold text-primary">{categoryCounts[cat]}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {toolCategories[cat].label}
            </div>
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ToolCard({ tool }: { tool: CompetitiveIntelligenceTool }) {
  const category = toolCategories[tool.category];

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {categoryIcons[tool.category]}
            </div>
            <div>
              <CardTitle className="text-base">{tool.name}</CardTitle>
              <Badge variant="outline" className="text-[10px] mt-1">
                {category.label}
              </Badge>
            </div>
          </div>
          <Badge
            variant={tool.pricing === "Gratuito" ? "default" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {tool.pricing}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-xs line-clamp-2">
          {tool.description}
        </CardDescription>

        {tool.features && tool.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.features.slice(0, 3).map((feature, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[10px] bg-muted/50"
              >
                {feature}
              </Badge>
            ))}
            {tool.features.length > 3 && (
              <Badge variant="outline" className="text-[10px] bg-muted/50">
                +{tool.features.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {tool.website && (
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Visitar site
            </a>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Bookmark className="h-3 w-3 mr-1" />
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

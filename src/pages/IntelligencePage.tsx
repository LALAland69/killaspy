import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolsKnowledgeBase } from "@/components/intelligence/ToolsKnowledgeBase";
import { CompetitiveIntelligenceReport } from "@/components/intelligence/CompetitiveIntelligenceReport";
import { BookOpen, FileText } from "lucide-react";

export default function IntelligencePage() {
  return (
    <Tabs defaultValue="tools" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tools" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Base de Conhecimento
        </TabsTrigger>
        <TabsTrigger value="report" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerador de Relatórios
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tools">
        <ToolsKnowledgeBase />
      </TabsContent>

      <TabsContent value="report">
        <CompetitiveIntelligenceReport />
      </TabsContent>
    </Tabs>
  );
}

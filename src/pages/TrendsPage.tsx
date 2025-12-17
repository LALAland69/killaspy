import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendValidationPanel } from "@/components/trends/TrendValidationPanel";
import Trends from "./Trends";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function TrendsPage() {
  return (
    <AppLayout>
      <Tabs defaultValue="validation" className="space-y-6">
        <TabsList>
          <TabsTrigger value="validation" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Validação de Tendências
          </TabsTrigger>
          <TabsTrigger value="niches" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Tendências de Nicho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation">
          <TrendValidationPanel />
        </TabsContent>

        <TabsContent value="niches">
          <Trends />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

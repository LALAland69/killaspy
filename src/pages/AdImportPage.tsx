import { AppLayout } from "@/components/layout/AppLayout";
import { AdLibraryImport } from "@/components/ads/AdLibraryImport";
import { CategoriesManager } from "@/components/categories/CategoriesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileUp } from "lucide-react";

export default function AdImportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad Import</h1>
          <p className="text-muted-foreground">
            Configure coleta automática ou importe ads manualmente
          </p>
        </div>
        
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2">
              <Database className="h-4 w-4" />
              Coleta Automática
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <FileUp className="h-4 w-4" />
              Import Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="manual">
            <AdLibraryImport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

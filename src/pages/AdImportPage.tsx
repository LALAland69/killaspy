import { AppLayout } from "@/components/layout/AppLayout";
import { AdLibraryImport } from "@/components/ads/AdLibraryImport";

export default function AdImportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad Import</h1>
          <p className="text-muted-foreground">
            Import ads from Facebook Ad Library for analysis
          </p>
        </div>
        <AdLibraryImport />
      </div>
    </AppLayout>
  );
}

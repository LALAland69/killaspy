import { AppLayout } from "@/components/layout/AppLayout";
import { AdvertisersTable } from "@/components/advertisers/AdvertisersTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdvertisersPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Advertisers</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor advertiser networks and behavior patterns</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search advertisers..." 
              className="pl-9 bg-secondary border-border/50"
            />
          </div>
        </div>

        {/* Table */}
        <AdvertisersTable />
      </div>
    </AppLayout>
  );
}

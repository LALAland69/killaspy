import { TopBar } from "./TopBar";
import { useFacebookApiRecoveryNotification } from "@/hooks/useFacebookApiRecoveryNotification";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Listen for Facebook API recovery notifications in real-time
  useFacebookApiRecoveryNotification();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}

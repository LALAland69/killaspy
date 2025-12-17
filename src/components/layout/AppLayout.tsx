import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-56">
        <TopBar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

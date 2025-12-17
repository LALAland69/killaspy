import { Database, User, LogOut, Bell, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertsDropdown } from "@/components/alerts/AlertsDropdown";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mainNavigation = [
  { name: "Trends", href: "/trends" },
  { name: "Ad Library", href: "/ads" },
  { name: "Saved Ads", href: "/saved-ads" },
  { name: "Divergência", href: "/divergence" },
  { name: "Intelligence", href: "/intelligence" },
];

const moreNavigation = [
  { name: "Dashboard", href: "/" },
  { name: "Anunciantes", href: "/advertisers" },
  { name: "Domínios", href: "/domains" },
  { name: "Auditoria", href: "/security-audits" },
  { name: "Import", href: "/import" },
  { name: "Jobs", href: "/jobs" },
  { name: "Alertas", href: "/alerts" },
];

const allNavigation = [...mainNavigation, ...moreNavigation];

export function TopBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Mobile Menu Button */}
      <div className="flex md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Database className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">KillaSpy</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {allNavigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium rounded-md transition-all duration-200",
                      "animate-slide-in-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
                    )}
                    style={{ animationDelay: `${index * 30}ms`, animationFillMode: "both" }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Logo + Main Nav */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            KillaSpy
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {mainNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
                {isActive && (
                  <div className="h-0.5 bg-primary mt-1 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Mais
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {moreNavigation.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.href} className="w-full cursor-pointer">
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <AlertsDropdown />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

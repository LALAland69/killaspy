import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Globe, 
  TrendingUp, 
  Bell, 
  Settings,
  Eye,
  Database,
  LogOut,
  History,
  Download,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ads", href: "/ads", icon: Search },
  { name: "Salvos", href: "/saved-ads", icon: Heart },
  { name: "Anunciantes", href: "/advertisers", icon: Users },
  { name: "Domínios", href: "/domains", icon: Globe },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Divergência", href: "/divergence", icon: Eye },
  { name: "Auditoria", href: "/security-audits", icon: Database },
  { name: "Intelligence", href: "/intelligence", icon: BookOpen },
  { name: "Import", href: "/import", icon: Download },
  { name: "Jobs", href: "/jobs", icon: History },
];

const secondaryNavigation = [
  { name: "Alertas", href: "/alerts", icon: Bell },
  { name: "Config", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-48"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-14 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "gap-2 px-4"
          )}>
            <Database className="h-5 w-5 text-primary shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight text-foreground">
                KillaSpy
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute top-3 h-7 w-7 rounded-full border border-sidebar-border bg-sidebar text-muted-foreground hover:text-foreground",
              collapsed ? "right-[-14px]" : "right-[-14px]"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const NavItem = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150",
                    collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                    isActive && "bg-sidebar-accent text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {NavItem}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavItem;
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="border-t border-sidebar-border px-2 py-3">
            {secondaryNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const NavItem = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150",
                    collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                    isActive && "bg-sidebar-accent text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {NavItem}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavItem;
            })}
          </div>

          {/* User Section */}
          {user && (
            <div className="border-t border-sidebar-border px-2 py-3">
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={signOut}
                      className="w-full h-10 text-muted-foreground hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    Sair
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center justify-between px-1">
                  <p className="truncate text-xs text-muted-foreground max-w-[120px]">
                    {user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, TrendingUp, Cpu, Users, FileText,
  TicketCheck, Gift, ShieldCheck, BarChart3, Network,
  LogOut, Menu, X, ChevronRight, Bell, Settings,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/plans", label: "Investment Plans", icon: TrendingUp },
  { href: "/admin/nodes", label: "Node Management", icon: Cpu },
  { href: "/admin/users", label: "Users & Org", icon: Users },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/tickets", label: "Support Tickets", icon: TicketCheck, badge: true },
  { href: "/admin/airdrops", label: "Airdrop", icon: Gift },
  { href: "/admin/referrals", label: "Referrals", icon: Network },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sub-admins", label: "Sub-Admins", icon: ShieldCheck },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "sub_admin"),
    refetchInterval: 60000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (user?.role !== "admin" && user?.role !== "sub_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href) && href !== "/admin";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col
        bg-sidebar border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <div>
              <span className="font-display font-semibold text-sidebar-foreground text-sm">AlphaBag</span>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer group
                  ${active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }
                `}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && stats?.openTickets ? (
                    <Badge className="bg-destructive/80 text-white text-xs px-1.5 py-0 h-4 min-w-4">
                      {stats.openTickets}
                    </Badge>
                  ) : null}
                  {active && <ChevronRight className="w-3 h-3 text-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            {title && (
              <h1 className="text-lg font-display font-semibold text-foreground">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {stats?.openTickets ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-xs text-white flex items-center justify-center">
                  {stats.openTickets > 9 ? "9+" : stats.openTickets}
                </span>
              ) : null}
            </button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

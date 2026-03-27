import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, FileText, Users, Cpu,
  TicketCheck, Bell, Gift, ShieldCheck, LogOut, Shield,
  ClipboardList, CalendarClock, Image, Zap, FileSearch, Handshake,
  BarChart2, GitBranch,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/plans", label: "Plans", icon: "TrendingUp" },
  { href: "/admin/content", label: "Content", icon: "FileText" },
  { href: "/admin/users", label: "Users & Org", icon: "Users" },
  { href: "/admin/nodes", label: "Nodes", icon: "Cpu" },
  { href: "/admin/analytics", label: "Analytics", icon: "BarChart2" },
  { href: "/admin/referrals", label: "Referrals", icon: "GitBranch" },
  { href: "/admin/tickets", label: "Support Tickets", icon: "TicketCheck" },
  { href: "/admin/notifications", label: "Notifications", icon: "Bell" },
  { href: "/admin/airdrops", label: "Airdrop", icon: "Gift" },
  { href: "/admin/sub-admins", label: "Sub-Admins", icon: "ShieldCheck" },
  { href: "/admin/telegram-schedules", label: "Telegram Schedules", icon: "CalendarClock" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "ClipboardList" },
  { href: "/admin/media-assets", label: "Media Assets", icon: "Image" },
  { href: "/admin/trending-alerts", label: "Trending Alerts", icon: "Zap" },
  { href: "/admin/listing-requests", label: "Listing Requests", icon: "FileSearch" },
  { href: "/admin/partners", label: "Partners", icon: "Handshake" },
];

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard, TrendingUp, FileText, Users, Cpu,
  TicketCheck, Bell, Gift, ShieldCheck, ClipboardList, CalendarClock, Image, Zap, FileSearch, Handshake,
  BarChart2, GitBranch,
};

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin Panel" }: AdminLayoutProps) {
  const [location] = useLocation();

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_name");
      localStorage.removeItem("admin_role");
      window.location.href = "/admin/login";
    },
    onError: () => {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    },
  });

  const adminName = localStorage.getItem("admin_name") || "관리자";
  const adminRole = localStorage.getItem("admin_role") || "admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "oklch(0.08 0.005 240)" }}>
      {/* Sidebar */}
      <aside className="ab-sidebar">
        {/* Logo */}
        <div className="ab-sidebar-logo">
          <div style={{
            width: 28, height: 28,
            background: "oklch(0.72 0.18 55 / 0.15)",
            border: "1px solid oklch(0.72 0.18 55 / 0.4)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={14} color="oklch(0.72 0.18 55)" />
          </div>
          <span className="ab-sidebar-logo-text">AlphaBag Admin</span>
        </div>
        <div className="ab-sidebar-role">{adminName}</div>

        {/* Navigation */}
        <nav className="ab-sidebar-nav">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const Icon = ICONS[icon];
            const isActive = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={`ab-sidebar-link${isActive ? " active" : ""}`}>
                {Icon && <Icon size={14} />}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="ab-sidebar-footer">
          <button
            onClick={() => logoutMutation.mutate()}
            className="ab-btn ab-btn-outline ab-btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <LogOut size={12} />
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ab-main">
        <div className="ab-topbar">
          <span className="ab-topbar-title">{title}</span>
          <span className="ab-topbar-role">
            {adminRole === "admin" ? "관리자" : "부운영자"}
          </span>
        </div>
        <div className="ab-content ab-fade-in">
          {children}
        </div>
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid oklch(0.20 0.01 240)",
          display: "flex", gap: "1rem",
          fontSize: "0.72rem", color: "oklch(0.55 0.01 240)",
        }}>
          <a href="https://alphabag.net" target="_blank" rel="noopener noreferrer"
            style={{ color: "oklch(0.72 0.18 55)", textDecoration: "none" }}>
            COMPANY REGISTRATION
          </a>
          <a href="https://t.me/alphabag" target="_blank" rel="noopener noreferrer"
            style={{ color: "oklch(0.55 0.01 240)", textDecoration: "none" }}>
            TELEGRAM
          </a>
          <a href="https://twitter.com/alphabag" target="_blank" rel="noopener noreferrer"
            style={{ color: "oklch(0.55 0.01 240)", textDecoration: "none" }}>
            TWITTER
          </a>
        </div>
      </main>
    </div>
  );
}

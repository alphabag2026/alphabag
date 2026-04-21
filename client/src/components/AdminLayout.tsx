import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, TrendingUp, FileText, Users, Cpu,
  TicketCheck, Bell, Gift, ShieldCheck, LogOut, Shield,
  ClipboardList, CalendarClock, Image, Zap, FileSearch, Handshake,
  BarChart2, GitBranch, UserCog, Radio, Sparkles, Star, Coins, Key,
  Share2, ScrollText, ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LANGUAGES } from "@/lib/i18n";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard, TrendingUp, FileText, Users, Cpu,
  TicketCheck, Bell, Gift, ShieldCheck, ClipboardList, CalendarClock, Image, Zap, FileSearch, Handshake,
  BarChart2, GitBranch, UserCog, Radio, Sparkles, Star, Coins, Shield, Key, Share2, ScrollText,
};

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin Panel" }: AdminLayoutProps) {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const NAV_ITEMS = [
    { href: "/admin/dashboard",          label: t("adminNav.dashboard"),         icon: "LayoutDashboard" },
    { href: "/admin/plans",              label: t("adminNav.plans"),             icon: "TrendingUp" },
    { href: "/admin/content",            label: t("adminNav.content"),           icon: "FileText" },
    { href: "/admin/users",              label: t("adminNav.users"),             icon: "Users" },
    { href: "/admin/nodes",              label: t("adminNav.nodes"),             icon: "Cpu" },
    { href: "/admin/analytics",          label: t("adminNav.analytics"),         icon: "BarChart2" },
    { href: "/admin/referrals",          label: t("adminNav.referrals"),         icon: "GitBranch" },
    { href: "/admin/tickets",            label: t("adminNav.tickets"),           icon: "TicketCheck" },
    { href: "/admin/notifications",      label: t("adminNav.notifications"),     icon: "Bell" },
    { href: "/admin/airdrops",           label: t("adminNav.airdrop"),           icon: "Gift" },
    { href: "/admin/sub-admins",         label: t("adminNav.subAdmins"),         icon: "ShieldCheck" },
    { href: "/admin/telegram-schedules", label: t("adminNav.telegramSchedules"), icon: "CalendarClock" },
    { href: "/admin/audit-logs",         label: t("adminNav.auditLogs"),         icon: "ClipboardList" },
    { href: "/admin/media-assets",       label: t("adminNav.mediaAssets"),       icon: "Image" },
    { href: "/admin/trending-alerts",    label: t("adminNav.trendingAlerts"),    icon: "Zap" },
    { href: "/admin/listing-requests",   label: t("adminNav.listingRequests"),   icon: "FileSearch" },
    { href: "/admin/partners",           label: t("adminNav.partners"),          icon: "Handshake" },
    { href: "/admin/sns",                label: t("adminNav.sns"),               icon: "Radio" },
    { href: "/admin/ai-plan-import",     label: t("adminNav.aiPlanImport"),      icon: "Sparkles" },
    { href: "/admin/submissions",        label: t("adminNav.submissions"),       icon: "Star" },
    { href: "/admin/rewards",            label: t("adminNav.rewards"),           icon: "Coins" },
    { href: "/admin/cbag",               label: t("adminNav.cbag"),              icon: "Shield" },
    { href: "/admin/api-keys",           label: t("adminNav.apiKeys"),           icon: "Key" },
    { href: "/admin/site-settings",      label: t("adminNav.siteSettings"),      icon: "Share2" },
    { href: "/admin/legal",              label: t("adminNav.legal"),             icon: "ScrollText" },
  ];

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

  const adminName = localStorage.getItem("admin_name") || t("adminNav.adminLabel");
  const adminRole = localStorage.getItem("admin_role") || "admin";
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

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
            flexShrink: 0,
          }}>
            <Shield size={14} color="oklch(0.72 0.18 55)" />
          </div>
          <span className="ab-sidebar-logo-text">AlphaBag Admin</span>
        </div>
        <div className="ab-sidebar-role">{adminName}</div>

        {/* Language Selector */}
        <div className="ab-sidebar-lang" style={{ position: "relative" }}>
          <button
            onClick={() => setLangOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "oklch(0.14 0.01 240)", border: "1px solid oklch(0.22 0.012 240)",
              borderRadius: "6px", padding: "0.3rem 0.6rem",
              color: "oklch(0.72 0.01 240)", fontSize: "0.72rem", cursor: "pointer",
            }}
          >
            <span>{currentLang.flag} {currentLang.label}</span>
            <ChevronDown size={12} style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "0.15s" }} />
          </button>
          {langOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
              background: "oklch(0.12 0.008 240)", border: "1px solid oklch(0.22 0.012 240)",
              borderRadius: "6px", marginTop: "2px",
              maxHeight: "200px", overflowY: "auto",
              boxShadow: "0 4px 12px oklch(0 0 0 / 0.4)",
            }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "0.35rem 0.6rem",
                    background: i18n.language === lang.code ? "oklch(0.72 0.18 55 / 0.12)" : "transparent",
                    color: i18n.language === lang.code ? "oklch(0.72 0.18 55)" : "oklch(0.65 0.01 240)",
                    fontSize: "0.72rem", cursor: "pointer", border: "none",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="ab-sidebar-nav">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const Icon = ICONS[icon];
            const isActive = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={`ab-sidebar-link${isActive ? " active" : ""}`}
                title={label}
              >
                {Icon && <Icon size={14} />}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="ab-sidebar-footer">
          <Link
            href="/admin/my-account"
            className={`ab-sidebar-link${location === "/admin/my-account" ? " active" : ""}`}
            style={{ marginBottom: "0.5rem" }}
            title={t("adminNav.myAccount")}
          >
            <UserCog size={14} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t("adminNav.myAccount")}
            </span>
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className="ab-btn ab-btn-outline ab-btn-sm"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <LogOut size={12} />
            {t("adminNav.logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ab-main">
        <div className="ab-topbar">
          <span className="ab-topbar-title">{title}</span>
          <span className="ab-topbar-role">
            {adminRole === "admin" ? t("adminNav.adminLabel") : t("adminNav.subAdminLabel")}
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

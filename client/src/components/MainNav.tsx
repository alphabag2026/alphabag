import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BarChart3, LogOut, Menu, Wallet, X, Bell } from "lucide-react";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/golden", label: "Golden", color: "hover:text-amber-400 hover:bg-amber-400/5", active: "text-amber-400" },
    { href: "/self", label: "Self", color: "hover:text-blue-400 hover:bg-blue-400/5", active: "text-blue-400" },
    { href: "/node", label: "Node", color: "hover:text-purple-400 hover:bg-purple-400/5", active: "text-purple-400" },
    { href: "/notices", label: "Notices", color: "hover:text-white hover:bg-white/5", active: "text-white" },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* 로고 */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-black font-black text-xs">AB</span>
              </div>
              <span className="font-bold text-white text-sm tracking-wide">AlphaBag</span>
            </div>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  isActive(item.href) ? item.active : `text-gray-400 ${item.color}`
                }`}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost" className="text-xs text-gray-400 hover:text-white h-8 px-3">
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-red-400 h-8 px-2"
                  onClick={() => logout()}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="h-8 px-4 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                Connect
              </Button>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-1.5 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0d0d0d] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive(item.href) ? item.active : `text-gray-400 ${item.color}`
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}
          {isAuthenticated && (
            <Link href="/dashboard">
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

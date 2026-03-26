import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BarChart3, LogOut, Menu, X, ShoppingCart, Wallet } from "lucide-react";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { isConnected, address, openModal, disconnectWallet } = useWallet();
  const [location] = useLocation();

  const navItems = [
    { href: "/golden", label: "Golden", color: "hover:text-amber-400 hover:bg-amber-400/5", active: "text-amber-400" },
    { href: "/self", label: "Self", color: "hover:text-blue-400 hover:bg-blue-400/5", active: "text-blue-400" },
    { href: "/node", label: "Node", color: "hover:text-purple-400 hover:bg-purple-400/5", active: "text-purple-400" },
    { href: "/notices", label: "Notices", color: "hover:text-white hover:bg-white/5", active: "text-white" },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* 로고 */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
              <img
                src={ALPHABAG_LOGO}
                alt="AlphaBag"
                className="w-9 h-9 rounded-lg object-contain bg-black"
                onError={(e) => {
                  // 이미지 로드 실패 시 텍스트 폴백
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center">
                <span className="text-black font-black text-xs">AB</span>
              </div>
              <div>
                <div className="font-black text-white text-base leading-tight">AlphaBag</div>
                <div className="text-[10px] text-amber-400/70 leading-tight">Multi-Asset</div>
              </div>
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
            {/* 언어 전환 */}
            <LanguageSwitcher />

            {/* 지갑 연결 버튼 */}
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="hidden sm:inline">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <span className="sm:hidden">연결됨</span>
              </button>
            ) : (
              <button
                onClick={openModal}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                지갑 연결
              </button>
            )}

            {/* 장바구니 */}
            <Link href="/cart">
              <button className="relative flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">장바구니</span>
              </button>
            </Link>

            {/* 대시보드 (로그인 시) */}
            {isAuthenticated && (
              <Link href="/dashboard">
                <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </Link>
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
          {/* 모바일 지갑 연결 */}
          <div className="pt-2 border-t border-white/5">
            {isConnected ? (
              <button
                onClick={() => { disconnectWallet(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </button>
            ) : (
              <button
                onClick={() => { openModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                지갑 연결
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

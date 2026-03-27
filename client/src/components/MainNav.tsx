import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWallet } from "@/contexts/WalletContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BarChart3, Menu, X, ShoppingCart, Wallet, ChevronDown, Copy, LogOut, ExternalLink, User } from "lucide-react";
import { toast } from "sonner";

const ALPHABAG_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663373200888/TGrbnQ7ygm6GBAS6CWnuGe/alphabag-logo_df90878d.png";

export function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { isConnected, address, chainId, openModal, disconnectWallet } = useWallet();
  const [location] = useLocation();

  const navItems = [
    { href: "/golden", label: "Golden", color: "hover:text-amber-600 hover:bg-amber-50", active: "text-amber-600 bg-amber-50 font-semibold" },
    { href: "/self", label: "Self", color: "hover:text-blue-600 hover:bg-blue-50", active: "text-blue-600 bg-blue-50 font-semibold" },
    { href: "/node", label: "Node", color: "hover:text-purple-600 hover:bg-purple-50", active: "text-purple-600 bg-purple-50 font-semibold" },
    { href: "/leader", label: "Leader", color: "hover:text-emerald-600 hover:bg-emerald-50", active: "text-emerald-600 bg-emerald-50 font-semibold" },
    { href: "/meme", label: "Meme", color: "hover:text-pink-600 hover:bg-pink-50", active: "text-pink-600 bg-pink-50 font-semibold" },
    { href: "/influencer", label: "Influencer", color: "hover:text-orange-600 hover:bg-orange-50", active: "text-orange-600 bg-orange-50 font-semibold" },
    { href: "/notices", label: "Notices", color: "hover:text-foreground hover:bg-muted", active: "text-foreground bg-muted font-semibold" },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("주소가 복사되었습니다.");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setProfileOpen(false);
  };

  const getChainName = (id?: number) => {
    const chains: Record<number, string> = {
      1: "Ethereum", 56: "BSC", 137: "Polygon",
      42161: "Arbitrum", 10: "Optimism", 8453: "Base", 43114: "Avalanche",
    };
    return id ? (chains[id] || `Chain ${id}`) : "Unknown";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* 로고 */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
              <img
                src={ALPHABAG_LOGO}
                alt="AlphaBag"
                className="w-9 h-9 rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (next) { next.classList.remove("hidden"); next.classList.add("flex"); }
                }}
              />
              <div className="hidden w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center">
                <span className="text-black font-black text-xs">AB</span>
              </div>
              <div>
                <div className="font-black text-foreground text-base leading-tight">AlphaBag</div>
                <div className="text-[10px] text-amber-500 leading-tight">Multi-Asset</div>
              </div>
            </div>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-none">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  isActive(item.href) ? item.active : `text-muted-foreground ${item.color}`
                }`}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher />

            {isConnected ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-black" />
                  </div>
                  <span className="hidden sm:inline font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* 프로필 드롭다운 */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border bg-amber-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">연결된 지갑</div>
                          <div className="font-mono text-sm text-foreground truncate">
                            {address?.slice(0, 10)}...{address?.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">네트워크</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-xs text-green-600 font-medium">{getChainName(chainId)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleCopyAddress}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                        주소 복사
                      </button>
                      <a
                        href={`https://etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        Explorer에서 보기
                      </a>
                      {isAuthenticated && (
                        <Link href="/dashboard">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            대시보드
                          </button>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        지갑 연결 해제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openModal}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
              >
                <Wallet className="w-3.5 h-3.5" />
                지갑 연결
              </button>
            )}

            <Link href="/cart">
              <button className="relative flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-all">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">장바구니</span>
              </button>
            </Link>

            <button
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive(item.href) ? item.active : `text-muted-foreground ${item.color}`
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}

          <div className="pt-2 border-t border-border/40">
            {isConnected ? (
              <div className="space-y-1">
                <div className="px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <User className="w-3 h-3 text-black" />
                    </div>
                    <div>
                      <div className="text-xs text-amber-700 font-mono">{address?.slice(0, 10)}...{address?.slice(-6)}</div>
                      <div className="text-[10px] text-muted-foreground">{getChainName(chainId)}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { handleCopyAddress(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  주소 복사
                </button>
                <button
                  onClick={() => { handleDisconnect(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  지갑 연결 해제
                </button>
              </div>
            ) : (
              <button
                onClick={() => { openModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
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

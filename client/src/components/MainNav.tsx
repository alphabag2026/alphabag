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
    { href: "/golden", label: "Golden", color: "hover:text-amber-400 hover:bg-amber-400/5", active: "text-amber-400 bg-amber-400/10" },
    { href: "/self", label: "Self", color: "hover:text-blue-400 hover:bg-blue-400/5", active: "text-blue-400 bg-blue-400/10" },
    { href: "/node", label: "Node", color: "hover:text-purple-400 hover:bg-purple-400/5", active: "text-purple-400 bg-purple-400/10" },
    { href: "/leader", label: "Leader", color: "hover:text-emerald-400 hover:bg-emerald-400/5", active: "text-emerald-400 bg-emerald-400/10" },
    { href: "/meme", label: "Meme", color: "hover:text-pink-400 hover:bg-pink-400/5", active: "text-pink-400 bg-pink-400/10" },
    { href: "/influencer", label: "Influencer", color: "hover:text-orange-400 hover:bg-orange-400/5", active: "text-orange-400 bg-orange-400/10" },
    { href: "/notices", label: "Notices", color: "hover:text-white hover:bg-white/5", active: "text-white bg-white/10" },
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  // 외부 클릭 시 드롭다운 닫기
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
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      43114: "Avalanche",
    };
    return id ? (chains[id] || `Chain ${id}`) : "Unknown";
  };

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
                  (e.target as HTMLImageElement).style.display = "none";
                  const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (next) { next.classList.remove("hidden"); next.classList.add("flex"); }
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
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-none">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  isActive(item.href) ? item.active : `text-gray-400 ${item.color}`
                }`}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 언어 전환 */}
            <LanguageSwitcher />

            {/* 지갑 연결 / 프로필 드롭다운 */}
            {isConnected ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-black" />
                  </div>
                  <span className="hidden sm:inline font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* 프로필 드롭다운 */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                    {/* 헤더 */}
                    <div className="px-4 py-3 border-b border-white/5 bg-amber-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-black" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-gray-400">연결된 지갑</div>
                          <div className="font-mono text-sm text-white truncate">
                            {address?.slice(0, 10)}...{address?.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 체인 정보 */}
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">네트워크</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-xs text-green-400 font-medium">{getChainName(chainId)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 항목 */}
                    <div className="py-1">
                      <button
                        onClick={handleCopyAddress}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                        주소 복사
                      </button>
                      <a
                        href={`https://etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        Explorer에서 보기
                      </a>
                      {isAuthenticated && (
                        <Link href="/dashboard">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <BarChart3 className="w-4 h-4 text-gray-500" />
                            대시보드
                          </button>
                        </Link>
                      )}
                    </div>

                    {/* 연결 해제 */}
                    <div className="border-t border-white/5 py-1">
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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

            {/* 장바구니 */}
            <Link href="/cart">
              <button className="relative flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-all">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">장바구니</span>
              </button>
            </Link>

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

          {/* 모바일 지갑 */}
          <div className="pt-2 border-t border-white/5">
            {isConnected ? (
              <div className="space-y-1">
                <div className="px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <User className="w-3 h-3 text-black" />
                    </div>
                    <div>
                      <div className="text-xs text-amber-300 font-mono">{address?.slice(0, 10)}...{address?.slice(-6)}</div>
                      <div className="text-[10px] text-gray-500">{getChainName(chainId)}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { handleCopyAddress(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  주소 복사
                </button>
                <button
                  onClick={() => { handleDisconnect(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  지갑 연결 해제
                </button>
              </div>
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

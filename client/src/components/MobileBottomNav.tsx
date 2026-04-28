import { useLocation, Link } from "wouter";
import { Home, LayoutGrid, Droplets, User, Gift } from "lucide-react";

const tabs = [
  { path: "/", label: "홈", icon: Home },
  { path: "/plans", label: "플랜", icon: LayoutGrid },
  { path: "/airdrop", label: "에어드랍", icon: Droplets },
  { path: "/rewards", label: "리워드", icon: Gift },
  { path: "/profile", label: "마이", icon: User },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--ab-card)",
        borderTop: "1px solid var(--ab-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
          return (
            <Link key={tab.path} href={tab.path} style={{ flex: 1, textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem 0.25rem",
                  gap: "0.2rem",
                  color: isActive ? "#f59e0b" : "var(--ab-muted)",
                  transition: "color 0.15s",
                  cursor: "pointer",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: 24,
                      height: 2,
                      background: "#f59e0b",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

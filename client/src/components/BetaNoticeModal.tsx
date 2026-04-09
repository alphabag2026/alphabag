import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "alphabag_beta_notice_closed_v2";

export default function BetaNoticeModal() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closed = localStorage.getItem(STORAGE_KEY);
    if (!closed) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      localStorage.setItem(STORAGE_KEY, "1");
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-400 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`relative w-full max-w-lg transition-all duration-400 ${
          closing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        }`}
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 185, 0, 0.3)",
          boxShadow: "0 0 60px rgba(255, 185, 0, 0.15), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top gold glow line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #FFB900, #FFD700, #FFB900, transparent)",
            borderRadius: "2px",
          }}
        />

        {/* Background decoration circle */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,185,0,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="p-8 pt-10">
          {/* Beta badge */}
          <div className="flex justify-center mb-5">
            <span
              style={{
                background: "linear-gradient(135deg, #FFB900, #FF8C00)",
                color: "#000",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: "3px",
                padding: "5px 16px",
                borderRadius: "20px",
                textTransform: "uppercase",
              }}
            >
              BETA TEST
            </span>
          </div>

          {/* Main title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,185,0,0.5))" }} />
              <span style={{ fontSize: "28px" }}>🚀</span>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, rgba(255,185,0,0.5), transparent)" }} />
            </div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #FFD700, #FFB900, #FFA500)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.3,
                marginBottom: "8px",
              }}
            >
              {t("beta.title")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "1px" }}>
              {t("beta.subtitle")}
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,185,0,0.3), transparent)",
              marginBottom: "24px",
            }}
          />

          {/* Body content */}
          <div className="space-y-4 mb-8">
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "15px",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              {t("beta.desc1")}
              <br />
              {t("beta.desc2")}
            </p>

            <div
              style={{
                background: "rgba(255,185,0,0.06)",
                border: "1px solid rgba(255,185,0,0.2)",
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <div className="flex items-start gap-3">
                <span style={{ fontSize: "18px", marginTop: "2px" }}>✨</span>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", lineHeight: 1.7 }}>
                  {t("beta.desc3")}
                  <br />
                  {t("beta.desc4")}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleClose}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #FFB900, #FF8C00)",
                color: "#000",
                fontWeight: 700,
                fontSize: "15px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.2s",
                boxShadow: "0 4px 20px rgba(255,185,0,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.target as HTMLButtonElement).style.boxShadow = "0 6px 25px rgba(255,185,0,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                (e.target as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(255,185,0,0.3)";
              }}
            >
              {t("beta.explore")}
            </button>
            <button
              onClick={handleClose}
              style={{
                width: "100%",
                padding: "11px",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 400,
                fontSize: "13px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              {t("beta.close")}
            </button>
          </div>
        </div>

        {/* Bottom gold glow line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            right: "20%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,185,0,0.2), transparent)",
            borderRadius: "2px",
          }}
        />
      </div>
    </div>
  );
}

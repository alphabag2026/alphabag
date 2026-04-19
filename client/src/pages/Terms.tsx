import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg = isDark ? "bg-[#0a0a0a] text-gray-200" : "bg-white text-gray-800";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200";
  const headingColor = isDark ? "text-amber-400" : "text-amber-600";
  const subHeading = isDark ? "text-gray-300" : "text-gray-700";
  const body = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <Link href="/">
          <button className={`flex items-center gap-2 text-sm mb-8 ${body} hover:text-amber-400 transition-colors`}>
            <ArrowLeft className="w-4 h-4" />
            {t("footer.termsLink", "Terms of Service")}
          </button>
        </Link>

        <h1 className={`text-3xl font-bold mb-2 ${headingColor}`}>
          {t("footer.termsLink", "Terms of Service")}
        </h1>
        <p className={`text-sm mb-8 ${body}`}>Last updated: April 2026</p>

        <div className={`rounded-2xl border p-6 space-y-8 ${cardBg}`}>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>1. Platform Purpose</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              AlphaBag is a decentralized community platform. Our first principle is <strong className="text-amber-400">"Don't invest"</strong>.
              We do not provide investment advice, financial guidance, or recommendations to purchase any asset.
              All content is for educational and informational purposes only.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>2. No Financial Advice</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              Nothing on this platform constitutes investment, legal, tax, or financial advice.
              Any information presented is for research and learning purposes only.
              You should consult a qualified professional before making any financial decisions.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>3. User Responsibilities</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              By using AlphaBag, you agree that:
            </p>
            <ul className={`text-sm leading-relaxed ${body} list-disc list-inside mt-2 space-y-1`}>
              <li>You are solely responsible for your own investment decisions.</li>
              <li>You will conduct your own independent research before acting on any information.</li>
              <li>You understand that all investments carry risk, including loss of principal.</li>
              <li>You will not use the platform for illegal activities.</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>4. Third-Party Content</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              Content from third-party sources (news, SNS feeds, market data) is provided as-is.
              AlphaBag does not verify, endorse, or guarantee the accuracy of third-party content.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>5. Limitation of Liability</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              AlphaBag and its contributors shall not be liable for any direct, indirect, incidental,
              special, or consequential damages arising from your use of the platform or reliance on
              any information provided herein.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>6. Changes to Terms</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We reserve the right to modify these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>7. Contact</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              For questions about these terms, please contact us through our official Telegram community.
            </p>
          </section>

        </div>

        {/* Footer disclaimer */}
        <div className={`mt-8 rounded-xl border p-4 ${cardBg}`}>
          <p className={`text-[10px] leading-relaxed text-center ${body}`}>
            <span className={`font-semibold text-[11px] block mb-1.5 ${subHeading}`}>⚠️ Disclaimer</span>
            {t("footer.disclaimer", "")}
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/privacy">
            <span className={`text-xs underline cursor-pointer hover:text-amber-400 transition-colors ${body}`}>
              {t("footer.privacyLink", "Privacy Policy")} →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

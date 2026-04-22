import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
            {t("footer.privacyLink", "Privacy Policy")}
          </button>
        </Link>

        <h1 className={`text-3xl font-bold mb-2 ${headingColor}`}>
          {t("footer.privacyLink", "Privacy Policy")}
        </h1>
        <p className={`text-sm mb-8 ${body}`}>Last updated: April 2026</p>

        <div className={`rounded-2xl border p-6 space-y-8 ${cardBg}`}>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>1. Information We Collect</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              When you use AlphaBag, we may collect:
            </p>
            <ul className={`text-sm leading-relaxed ${body} list-disc list-inside mt-2 space-y-1`}>
              <li>Account information (username, email) provided during OAuth login</li>
              <li>Wallet addresses you connect voluntarily</li>
              <li>Usage data (pages visited, features used) for analytics</li>
              <li>Communications you send through the platform (QnA, tickets)</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>2. How We Use Your Information</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We use collected information to:
            </p>
            <ul className={`text-sm leading-relaxed ${body} list-disc list-inside mt-2 space-y-1`}>
              <li>Provide and improve platform services</li>
              <li>Personalize your experience (favorites, referrals)</li>
              <li>Send platform notifications you opt into</li>
              <li>Analyze usage patterns to improve the platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>3. Data Sharing</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We do not sell your personal data. We may share data with:
            </p>
            <ul className={`text-sm leading-relaxed ${body} list-disc list-inside mt-2 space-y-1`}>
              <li>Service providers who help operate the platform (hosting, analytics)</li>
              <li>Law enforcement when required by law</li>
              <li>Other parties only with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>4. Cookies & Tracking</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We use session cookies for authentication purposes. These are essential for the platform
              to function and cannot be disabled. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>5. Blockchain Data</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              Blockchain transactions are public by nature. Any wallet address you connect or
              transaction you make on-chain is publicly visible on the respective blockchain.
              AlphaBag has no control over blockchain data visibility.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>6. Data Retention</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We retain your data as long as your account is active. You may request account deletion
              by contacting us through our official Telegram channel. Upon deletion, personal data
              will be removed within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>7. Your Rights</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              Depending on your jurisdiction, you may have rights to:
            </p>
            <ul className={`text-sm leading-relaxed ${body} list-disc list-inside mt-2 space-y-1`}>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to certain processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>8. Security</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              We implement industry-standard security measures including HTTPS encryption, secure
              session management, and access controls. However, no system is 100% secure and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className={`text-lg font-semibold mb-3 ${subHeading}`}>9. Contact</h2>
            <p className={`text-sm leading-relaxed ${body}`}>
              For privacy-related inquiries, please contact us through our official Telegram community.
            </p>
          </section>

        </div>

        <div className="mt-6 text-center">
          <Link href="/terms">
            <span className={`text-xs underline cursor-pointer hover:text-amber-400 transition-colors ${body}`}>
              {t("footer.termsLink", "Terms of Service")} →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

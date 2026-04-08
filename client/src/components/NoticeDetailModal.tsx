import { X, Bell, Calendar, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Notice {
  id: number;
  title: string;
  content: string;
  [key: string]: any;
  type?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  linkUrl?: string | null;
}

interface NoticeDetailModalProps {
  notice: Notice;
  onClose: () => void;
  isDark?: boolean;
}

const NOTICE_LANG_MAP: Record<string, string> = {
  zh: "Zh", ja: "Ja", ko: "Ko", vi: "Vi", th: "Th", id: "Id",
  ms: "Ms", ru: "Ru", ar: "Ar", es: "Es", pt: "Pt", fr: "Fr",
  de: "De", it: "It", tr: "Tr", hi: "Hi", pl: "Pl", nl: "Nl",
  uk: "Uk", tl: "Tl", en: "En",
};

export function NoticeDetailModal({ notice, onClose, isDark = true }: NoticeDetailModalProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").slice(0, 2);
  const suffix = NOTICE_LANG_MAP[lang] ?? "En";
  const localTitle = notice[`title${suffix}`] || notice.title;
  const localContent = notice[`content${suffix}`] || notice.content;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const locale = i18n.language || "en";
    return new Date(date).toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const bg = isDark ? "bg-[#0d0d0d] border-amber-500/30" : "bg-white border-amber-400/40";
  const headerBg = isDark ? "border-white/5 bg-amber-500/5" : "border-gray-100 bg-amber-50";
  const contentBg = isDark ? "bg-[#1a1a1a]" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-300" : "text-gray-600";
  const textMuted = isDark ? "text-gray-500" : "text-gray-400";
  const closeBtnStyle = isDark
    ? "border-white/10 text-gray-400 hover:text-white"
    : "border-gray-200 text-gray-500 hover:text-gray-900";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`border rounded-2xl w-full max-w-md overflow-hidden ${bg}`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${headerBg}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-medium">{t("notice.noticeLabel")}</div>
              <div className={`font-bold text-sm ${textPrimary}`}>{localTitle}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${textMuted}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4">
          {/* 날짜 */}
          {notice.createdAt && (
            <div className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
              <Calendar className="w-3 h-3" />
              {formatDate(notice.createdAt)}
            </div>
          )}

          {/* 공지 내용 */}
          <div className={`rounded-xl p-4 ${contentBg}`}>
            <div className={`text-sm whitespace-pre-wrap leading-relaxed ${textSecondary}`}>
              {localContent}
            </div>
          </div>

          {/* 링크 버튼 */}
          {notice.linkUrl && (
            <a
              href={notice.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
            >
              {t("plans.viewAll")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl border text-sm transition-colors ${closeBtnStyle}`}
          >
            {t("notice.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

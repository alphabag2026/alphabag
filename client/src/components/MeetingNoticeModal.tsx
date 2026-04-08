import { X, Video, Calendar, ExternalLink, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MeetingNotice {
  id: number;
  title: string;
  content: string;
  meetingUrl?: string | null;
  meetingDate?: Date | null;
  meetingPlatform?: string | null;
}

interface MeetingNoticeModalProps {
  notice: MeetingNotice;
  onClose: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  zoom: "🎥",
  google_meet: "📹",
  teams: "💼",
  telegram: "✈️",
  discord: "🎮",
};

export function MeetingNoticeModal({ notice, onClose }: MeetingNoticeModalProps) {
  const { t, i18n } = useTranslation();
  const platform = notice.meetingPlatform || "zoom";
  const platformIcon = PLATFORM_ICONS[platform.toLowerCase()] || "🎥";
  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1).replace("_", " ");

  const formatDate = (date: Date | null | undefined) => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d0d0d] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-amber-400 font-medium">{t("notice.noticeLabel")}</div>
              <div className="font-bold text-white text-sm">{notice.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Platform & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a1a1a] rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">Platform</div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <span>{platformIcon}</span>
                {platformLabel}
              </div>
            </div>
            {notice.meetingDate && (
              <div className="bg-[#1a1a1a] rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date
                </div>
                <div className="text-xs font-medium text-amber-300">
                  {formatDate(notice.meetingDate)}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {notice.content}
            </div>
          </div>

          {/* Join button */}
          {notice.meetingUrl && (
            <a
              href={notice.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
            >
              <Users className="w-4 h-4" />
              {t("plans.viewAll")}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
          >
            {t("notice.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

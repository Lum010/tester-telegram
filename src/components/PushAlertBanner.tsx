import React, { useEffect } from 'react';
import { Bell, X, Send, ExternalLink, ChevronRight } from 'lucide-react';
import { PushAlertNotification } from '../types';
import { soundService } from '../services/soundAndHaptics';

interface PushAlertBannerProps {
  notification: PushAlertNotification | null;
  onDismiss: () => void;
  onViewEvent: (eventId: string) => void;
  botUsername: string;
}

export const PushAlertBanner: React.FC<PushAlertBannerProps> = ({
  notification,
  onDismiss,
  onViewEvent,
  botUsername,
}) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div className="fixed top-3 left-3 right-3 sm:max-w-md sm:mx-auto z-50 animate-in slide-in-from-top duration-300">
      <div
        onClick={() => onViewEvent(notification.eventId)}
        className="bg-[#17212b]/95 border border-sky-500/50 shadow-2xl rounded-2xl p-3 backdrop-blur-xl cursor-pointer hover:border-sky-400 transition-all select-none"
      >
        <div className="flex items-start justify-between gap-2.5">
          {/* Left Telegram Bot Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/30">
            <Send className="w-4 h-4 -rotate-12" />
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 truncate">
                @{botUsername || 'PulseFestRadarBot'}
              </span>
              <span className="text-[10px] text-[#798b9b] font-mono">
                {notification.timestamp}
              </span>
            </div>

            <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">
              🚨 {notification.eventTitle}
            </h4>

            <p className="text-[11px] text-[#798b9b] line-clamp-1 mt-0.5">
              Matched: "{notification.filterName}" • 📍 {notification.venue}, {notification.city}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundService.triggerHaptic([10]);
              onDismiss();
            }}
            className="p-1 rounded-lg text-[#798b9b] hover:text-white hover:bg-[#242f3d] flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom micro-bar */}
        <div className="mt-2 pt-2 border-t border-[#242f3d] flex items-center justify-between text-[11px]">
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Dispatched via Telegram Bot API
          </span>
          <span className="text-sky-400 font-semibold flex items-center gap-0.5">
            <span>Tap to View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

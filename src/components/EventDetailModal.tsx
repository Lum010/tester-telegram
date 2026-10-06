import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Ticket,
  ExternalLink,
  Flame,
  Send,
  Share2,
  Users,
  ShieldAlert,
  Clock,
  Music,
} from 'lucide-react';
import { ConcertEvent, TelegramConfig } from '../types';
import { soundService } from '../services/soundAndHaptics';

interface EventDetailModalProps {
  event: ConcertEvent | null;
  config: TelegramConfig;
  onClose: () => void;
  onTriggerAlert: (event: ConcertEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  config,
  onClose,
  onTriggerAlert,
}) => {
  if (!event) return null;

  const handleSendTelegram = () => {
    soundService.playTelegramChime();
    onTriggerAlert(event);
  };

  const handleShare = () => {
    soundService.triggerHaptic([15]);
    const text = `🔥 Check out ${event.title} in ${event.city} on PulseFest!`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(event.ticketUrl)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCalendar = () => {
    soundService.triggerHaptic([15]);
    // Create Google Calendar event link
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `${event.description}\n\nVenue: ${event.venue}\nTickets: ${event.ticketUrl}\nPowered by PulseFest Telegram Radar`
    );
    const location = encodeURIComponent(`${event.venue}, ${event.city}, ${event.country}`);
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#17212b] border border-[#242f3d] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Poster Header */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-900">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/40 to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {event.isTrending && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg shadow-md">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  TRENDING
                </span>
              )}
              <span className="px-2 py-0.5 bg-black/60 text-white text-xs font-semibold rounded-lg backdrop-blur-md border border-white/10">
                {event.type === 'festival' ? '🎪 Music Festival' : '⚡ Concert'}
              </span>
            </div>

            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow">
              {event.ticketStatus}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {event.title}
            </h2>
            <p className="text-sm font-semibold text-sky-400 mt-0.5">
              {event.headliners.join(' • ')}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#0e1621] rounded-xl border border-[#242f3d] space-y-1">
              <span className="text-[#798b9b] flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Date & Schedule
              </span>
              <p className="font-semibold text-white">{event.displayDate}</p>
            </div>

            <div className="p-2.5 bg-[#0e1621] rounded-xl border border-[#242f3d] space-y-1">
              <span className="text-[#798b9b] flex items-center gap-1 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Location
              </span>
              <p className="font-semibold text-white truncate">
                {event.venue}, {event.city}
              </p>
            </div>

            <div className="p-2.5 bg-[#0e1621] rounded-xl border border-[#242f3d] space-y-1">
              <span className="text-[#798b9b] flex items-center gap-1 text-[11px]">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                Price Range
              </span>
              <p className="font-semibold text-emerald-400">
                From {event.currency} {event.priceFrom}
              </p>
            </div>

            <div className="p-2.5 bg-[#0e1621] rounded-xl border border-[#242f3d] space-y-1">
              <span className="text-[#798b9b] flex items-center gap-1 text-[11px]">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Crowd & Age
              </span>
              <p className="font-semibold text-white">
                {event.attendanceEstimate} • {event.ageRestriction}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300">About the Event</span>
            <p className="text-xs text-[#798b9b] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Full Lineup / Artists */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              <span>Confirmed Lineup & Artists</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {event.artists.map((artist) => (
                <span
                  key={artist}
                  className="px-2.5 py-1 rounded-xl bg-[#0e1621] text-xs font-medium text-slate-200 border border-[#242f3d]"
                >
                  {artist}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="space-y-2 pt-2 border-t border-[#242f3d]">
            {/* Primary: Dispatch Push Alert to Telegram */}
            <button
              onClick={handleSendTelegram}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4 -rotate-12" />
              <span>Send Instant Push Alert to My Telegram</span>
            </button>

            {/* Secondary actions: Tickets, Calendar, Share */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2e3c4d] text-emerald-400 text-xs font-bold transition-all text-center"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Buy Tickets</span>
              </a>

              <button
                onClick={handleAddToCalendar}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2e3c4d] text-slate-200 text-xs font-semibold transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Add to Cal</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2e3c4d] text-slate-200 text-xs font-semibold transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Share TG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

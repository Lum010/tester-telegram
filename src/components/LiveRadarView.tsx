import React, { useState, useEffect } from 'react';
import {
  Radio,
  Clock,
  Send,
  Ticket,
  ExternalLink,
  Flame,
  CheckCheck,
  Zap,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { ConcertEvent, PushAlertNotification, TelegramConfig } from '../types';
import { soundService } from '../services/soundAndHaptics';

interface LiveRadarViewProps {
  events: ConcertEvent[];
  notifications: PushAlertNotification[];
  config: TelegramConfig;
  onSelectEvent: (event: ConcertEvent) => void;
  onSimulateTicketDrop: () => void;
  onResendNotification: (notif: PushAlertNotification) => void;
}

export const LiveRadarView: React.FC<LiveRadarViewProps> = ({
  events,
  notifications,
  config,
  onSelectEvent,
  onSimulateTicketDrop,
  onResendNotification,
}) => {
  const [radarAngle, setRadarAngle] = useState(0);

  // Animate the radar sweep angle
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleDropClick = () => {
    soundService.triggerHaptic([30, 40]);
    onSimulateTicketDrop();
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 space-y-4">
      {/* Radar Scanner Dashboard */}
      <div className="relative bg-[#17212b] border border-sky-500/20 rounded-3xl p-5 overflow-hidden shadow-xl text-center">
        {/* Radar Rings Background */}
        <div className="relative w-48 h-48 mx-auto my-2 rounded-full border border-sky-500/30 flex items-center justify-center bg-[#0e1621]/90 overflow-hidden shadow-inner">
          {/* Inner Rings */}
          <div className="absolute w-36 h-36 rounded-full border border-sky-500/20"></div>
          <div className="absolute w-24 h-24 rounded-full border border-sky-500/25"></div>
          <div className="absolute w-12 h-12 rounded-full border border-sky-500/30"></div>

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-sky-500/20"></div>
          <div className="absolute h-full w-[1px] bg-sky-500/20"></div>

          {/* Sweeping Radar Beam */}
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 origin-top-left pointer-events-none"
            style={{
              transform: `rotate(${radarAngle}deg)`,
              background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.4) 0deg, transparent 60deg)',
            }}
          />

          {/* Random Blips representing active live events */}
          <div className="absolute top-10 left-16 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <div className="absolute bottom-12 right-14 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <div className="absolute top-16 right-10 w-2 h-2 rounded-full bg-rose-400 animate-ping"></div>

          {/* Center Hub */}
          <div className="z-10 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/50">
            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
          </div>
        </div>

        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real-time Telegram Bot API Dispatcher Active</span>
          </div>
          <p className="text-xs text-[#798b9b] mt-1.5 max-w-sm mx-auto">
            Continuously polling event registries, Resident Advisor, Ticketmaster API & organizer channels for newly scheduled drops.
          </p>
        </div>

        {/* Trigger Test Ticket Drop Button */}
        <div className="mt-4">
          <button
            onClick={handleDropClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Simulate Live Festival Ticket Drop Alert</span>
          </button>
        </div>
      </div>

      {/* Dispatched Push Notifications Log */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <h3 className="font-bold text-white flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-sky-400" />
            <span>Recent Telegram Alerts History ({notifications.length})</span>
          </h3>
          <span className="text-[#798b9b] text-[11px]">Instant Push Stream</span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-6 bg-[#17212b]/40 rounded-2xl border border-[#242f3d] text-center">
            <Clock className="w-8 h-8 text-[#798b9b] mx-auto mb-2 opacity-50" />
            <p className="text-xs text-[#798b9b]">
              No alerts dispatched yet. Click "Simulate Live Ticket Drop" above or tap "Push Alert" on any event!
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const matchedEvent = events.find((e) => e.id === n.eventId);
            return (
              <div
                key={n.id}
                className="bg-[#17212b] border border-[#242f3d] hover:border-sky-500/30 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                        {n.eventType === 'festival' ? '🎪 FESTIVAL' : '⚡ CONCERT'}
                      </span>
                      <span className="text-xs font-bold text-white line-clamp-1">
                        {n.eventTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#798b9b] mt-0.5">
                      📍 {n.venue}, {n.city} • 🗓 {n.displayDate}
                    </p>
                  </div>

                  <span className="text-[10px] text-[#798b9b] font-mono whitespace-nowrap">
                    {n.timestamp}
                  </span>
                </div>

                {/* Telegram delivery status */}
                <div className="flex items-center justify-between pt-1 border-t border-[#242f3d] text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Delivered to @{config.botUsername || 'PulseFestRadarBot'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {matchedEvent && (
                      <button
                        onClick={() => onSelectEvent(matchedEvent)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        View Event
                      </button>
                    )}
                    <button
                      onClick={() => onResendNotification(n)}
                      className="text-xs text-[#798b9b] hover:text-white p-1 rounded hover:bg-[#242f3d]"
                      title="Resend to Telegram"
                    >
                      <Send className="w-3 h-3 text-sky-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Terminal,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Ticket,
  Bell,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { TelegramMessage, TelegramConfig, ConcertEvent, EventGenre } from '../types';
import { processUserQuery } from '../services/botEngine';
import { soundService } from '../services/soundAndHaptics';

interface TelegramBotChatViewProps {
  messages: TelegramMessage[];
  onSendMessage: (text: string) => void;
  config: TelegramConfig;
  onOpenSettings: () => void;
  onTriggerAlert: (event: ConcertEvent) => void;
  onSelectEvent: (event: ConcertEvent) => void;
  onAddCustomFilter: (filter: { name: string; city: string; genres: EventGenre[]; maxPrice?: number }) => void;
  apiLogsCount: number;
}

export const TelegramBotChatView: React.FC<TelegramBotChatViewProps> = ({
  messages,
  onSendMessage,
  config,
  onTriggerAlert,
  onSelectEvent,
  onAddCustomFilter,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const showTgToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text) return;

    soundService.playSendPop();
    onSendMessage(text);
    if (!textToSend) setInputText('');
    setShowCommandsMenu(false);

    // Simulate realistic bot thinking delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      soundService.playTelegramChime();
    }, 600);
  };

  const handleInlineButtonClick = (btn: { text: string; callback_data?: string; url?: string }) => {
    soundService.triggerHaptic([20]);

    if (btn.url) {
      window.open(btn.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (btn.callback_data) {
      const cb = btn.callback_data;

      // Handle specific commands
      if (cb === 'cmd_trending' || cb === 'view_trending_all') {
        handleSend('/trending');
      } else if (cb === 'cmd_festivals' || cb === 'browse_festivals') {
        handleSend('/festivals');
      } else if (cb === 'cmd_filters' || cb === 'open_new_filter') {
        handleSend('/alerts');
      } else if (cb.startsWith('quick_alert_')) {
        const city = cb.replace('quick_alert_', '');
        onAddCustomFilter({
          name: `${city.toUpperCase()} Live Radar Alert`,
          city: city === 'custom' ? 'All Cities' : city,
          genres: ['Electronic', 'Indie', 'Rock'],
          maxPrice: 150,
        });
        showTgToast(`✅ Radar Alert Created for ${city}!`);
        handleSend(`Added active radar alert for ${city}! 🔔`);
      } else if (cb.startsWith('details_')) {
        const evtId = cb.replace('details_', '');
        showTgToast(`🔍 Fetching ticket details...`);
        handleSend(`Show me tickets for event #${evtId}`);
      } else {
        showTgToast(`Callback received: ${btn.text}`);
        handleSend(btn.text);
      }
    }
  };

  const commandShortcuts = [
    { cmd: '/trending', desc: 'Hottest festivals & concerts right now' },
    { cmd: '/festivals', desc: 'Multi-day outdoor music festivals' },
    { cmd: '/alerts', desc: 'Manage your active push notification rules' },
    { cmd: '/help', desc: 'Command manual and search tips' },
  ];

  const quickPromptChips = [
    '🔥 What is trending this week?',
    '🎧 Techno in Berlin',
    '🎪 Festivals under $200',
    '🎸 Indie gigs in London',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] sm:h-[650px] relative bg-[#0e1621] text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#17212b]/95 border border-sky-500/50 text-sky-300 text-xs font-semibold px-4 py-2 rounded-xl shadow-xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Telegram Chat Sub-header */}
      <div className="bg-[#17212b] border-b border-[#242f3d] px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Long-Polling Active</span>
          </div>
        </div>

        <button
          onClick={() => setShowCommandsMenu(!showCommandsMenu)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242f3d] hover:bg-[#2e3c4d] text-slate-300 hover:text-white transition-all text-xs"
        >
          <span className="font-mono text-sky-400">/</span>
          <span>Commands</span>
          {showCommandsMenu ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Commands Dropdown Overlay */}
      {showCommandsMenu && (
        <div className="absolute top-10 left-3 right-3 z-30 bg-[#17212b] border border-[#242f3d] rounded-2xl p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-[#798b9b] px-2 py-1 uppercase tracking-wider">
            Available Bot Commands
          </div>
          {commandShortcuts.map((c) => (
            <button
              key={c.cmd}
              onClick={() => handleSend(c.cmd)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#242f3d] text-left transition-all group"
            >
              <span className="font-mono text-xs font-bold text-sky-400 group-hover:text-sky-300">
                {c.cmd}
              </span>
              <span className="text-xs text-[#798b9b] truncate ml-2">{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages Stream Container with Telegram Subtle Chat Wallpaper Pattern */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 scroll-smooth"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.from === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Bubble */}
              <div
                className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                  isUser
                    ? 'bg-[#2b5278] text-white rounded-br-xs'
                    : 'bg-[#17212b] text-slate-100 border border-[#242f3d] rounded-bl-xs'
                }`}
              >
                {/* Bot Label if from bot */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-sky-400">
                    <span>PulseFest Bot</span>
                    <span className="text-[9px] px-1 py-0.2 bg-sky-500/20 text-sky-300 rounded font-normal">
                      BOT
                    </span>
                  </div>
                )}

                {/* Formatted Message Content */}
                <div
                  className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap font-normal"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />

                {/* Timestamp & Status Ticks */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#798b9b] select-none">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                </div>
              </div>

              {/* Telegram Inline Keyboard Buttons (Rendered underneath bot bubble) */}
              {msg.reply_markup?.inline_keyboard && (
                <div className="mt-1.5 space-y-1 w-[88%] sm:w-[80%]">
                  {msg.reply_markup.inline_keyboard.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-2 gap-1.5">
                      {row.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleInlineButtonClick(btn)}
                          className="flex items-center justify-center gap-1 py-2 px-2.5 bg-[#17212b] hover:bg-[#202d3b] active:bg-[#2b5278] border border-sky-500/20 text-sky-400 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 text-center truncate"
                        >
                          <span className="truncate">{btn.text}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Bot Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 bg-[#17212b] border border-[#242f3d] rounded-2xl rounded-bl-xs px-3 py-2 w-28">
            <span className="text-[11px] text-[#798b9b] font-medium">bot is typing</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="bg-[#17212b]/80 border-t border-[#242f3d] px-3 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
        {quickPromptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-[#0e1621] hover:bg-[#242f3d] text-slate-300 hover:text-white border border-[#242f3d] transition-all text-left truncate active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Telegram Message Input Bar */}
      <div className="bg-[#17212b] border-t border-[#242f3d] p-2.5 safe-area-pb">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask for trending events or type /start..."
            className="flex-1 bg-[#0e1621] border border-[#242f3d] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-[#798b9b] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-2xl transition-all shadow-md active:scale-95 ${
              inputText.trim()
                ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25'
                : 'bg-[#242f3d] text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

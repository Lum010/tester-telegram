import React, { useState, useEffect, useCallback } from 'react';
import { TelegramHeader } from './components/TelegramHeader';
import { BottomNavBar, AppTab } from './components/BottomNavBar';
import { TrendingEventsView } from './components/TrendingEventsView';
import { TelegramBotChatView } from './components/TelegramBotChatView';
import { AlertFiltersView } from './components/AlertFiltersView';
import { LiveRadarView } from './components/LiveRadarView';
import { TelegramApiConfigModal } from './components/TelegramApiConfigModal';
import { EventDetailModal } from './components/EventDetailModal';
import { PushAlertBanner } from './components/PushAlertBanner';

import {
  ConcertEvent,
  AlertFilter,
  TelegramConfig,
  TelegramMessage,
  PushAlertNotification,
  TelegramApiLog,
  EventGenre,
} from './types';
import { MOCK_EVENTS, INITIAL_FILTERS } from './data/mockEvents';
import { telegramBotService } from './services/telegramBotService';
import { processUserQuery, createWelcomeMessages } from './services/botEngine';
import { soundService } from './services/soundAndHaptics';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('trending');
  const [events] = useState<ConcertEvent[]>(MOCK_EVENTS);
  const [filters, setFilters] = useState<AlertFilter[]>(INITIAL_FILTERS);

  // Telegram Bot API configuration
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    let savedToken = '';
    let savedChat = '';
    try {
      savedToken = localStorage.getItem('pulsefest_bot_token') || '';
      savedChat = localStorage.getItem('pulsefest_chat_id') || '';
    } catch {}

    return {
      botToken: savedToken,
      botUsername: 'PulseFestRadarBot',
      chatId: savedChat,
      channelOrGroup: '@PulseFestRadar',
      isConnected: false,
      isTesting: false,
      pollingActive: false,
      useSimulationFallback: true,
    };
  });

  // Telegram bot messages history
  const [botMessages, setBotMessages] = useState<TelegramMessage[]>(() => createWelcomeMessages());

  // Push notifications stream
  const [notifications, setNotifications] = useState<PushAlertNotification[]>([
    {
      id: 'notif-init-1',
      eventId: 'evt-ultra-2026',
      eventTitle: 'Ultra Music Festival 2026',
      eventType: 'festival',
      city: 'Miami',
      venue: 'Bayfront Park',
      displayDate: 'Oct 16 - 18, 2026',
      genres: ['Electronic', 'Techno'],
      priceFrom: 349,
      filterName: 'Top US EDM & Indie Festivals',
      timestamp: '18:15',
      read: false,
      telegramDelivered: true,
    },
    {
      id: 'notif-init-2',
      eventId: 'evt-berghain-klubnacht',
      eventTitle: 'Berghain Klubnacht Marathon',
      eventType: 'concert',
      city: 'Berlin',
      venue: 'Berghain / Panorama Bar',
      displayDate: 'Oct 10 - 12, 2026',
      genres: ['Techno', 'Electronic'],
      priceFrom: 28,
      filterName: 'Berlin & Amsterdam Underground',
      timestamp: '17:42',
      read: false,
      telegramDelivered: true,
    },
  ]);

  const [activeBanner, setActiveBanner] = useState<PushAlertNotification | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<ConcertEvent | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [apiLogs, setApiLogs] = useState<TelegramApiLog[]>([]);

  // Sound and theme
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'midnight' | 'light'>('dark');
  const [isMobileFramed, setIsMobileFramed] = useState(false);

  // Auto-verify and connect Telegram Bot API on mount
  useEffect(() => {
    async function initTelegramConnection() {
      // 1. First check if backend has TELEGRAM_BOT_TOKEN set in environment
      const serverStatus = await telegramBotService.checkServerStatus();
      if (serverStatus.connected && serverStatus.botUsername) {
        setTelegramConfig((prev) => ({
          ...prev,
          botUsername: serverStatus.botUsername || prev.botUsername,
          isConnected: true,
          pollingActive: true,
        }));
        return;
      }

      // 2. If client has a saved token in localStorage, test it
      const savedToken = telegramConfig.botToken.trim();
      if (savedToken) {
        const verifyRes = await telegramBotService.getMe(savedToken);
        if (verifyRes.ok && verifyRes.user) {
          setTelegramConfig((prev) => ({
            ...prev,
            botUsername: verifyRes.user?.username || prev.botUsername,
            isConnected: true,
            pollingActive: true,
          }));
        } else {
          setTelegramConfig((prev) => ({ ...prev, isConnected: false }));
        }
      }
    }

    initTelegramConnection();
  }, []);

  // Subscribe to Telegram API telemetry logs
  useEffect(() => {
    const unsubscribe = telegramBotService.subscribeLogs((logs) => {
      setApiLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setSoundEnabled(next);
    if (next) soundService.playSendPop();
  };

  const handleToggleTheme = () => {
    soundService.triggerHaptic([10]);
    if (theme === 'dark') setTheme('midnight');
    else if (theme === 'midnight') setTheme('light');
    else setTheme('dark');
  };

  // Trigger push alert dispatch to Telegram
  const handleTriggerAlertForEvent = useCallback(
    async (event: ConcertEvent, filterName = 'Manual Alert Trigger') => {
      soundService.playTelegramChime();

      // 1. Format Telegram alert message with HTML & Inline Keyboard
      const formatted = telegramBotService.formatConcertAlertHtml(event, filterName);

      // 2. Dispatch via Telegram Bot API
      const res = await telegramBotService.sendMessage(
        telegramConfig.botToken,
        telegramConfig.chatId,
        formatted.text,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: formatted.buttons },
        }
      );

      // 3. Create push alert record
      const newNotif: PushAlertNotification = {
        id: 'notif-' + Math.random().toString(36).substring(2, 9),
        eventId: event.id,
        eventTitle: event.title,
        eventType: event.type,
        city: event.city,
        venue: event.venue,
        displayDate: event.displayDate,
        genres: event.genres,
        priceFrom: event.priceFrom,
        filterName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        telegramDelivered: res.ok,
        telegramMessageId: res.messageId,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setActiveBanner(newNotif);

      // 4. Also append message to bot conversation thread
      const botMsg: TelegramMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        from: 'bot',
        text: formatted.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateIso: new Date().toISOString(),
        isHtml: true,
        status: 'delivered',
        reply_markup: { inline_keyboard: formatted.buttons },
        eventRefId: event.id,
      };
      setBotMessages((prev) => [...prev, botMsg]);
    },
    [telegramConfig]
  );

  // Send message to Telegram bot chat
  const handleSendBotMessage = (text: string) => {
    const userMsg: TelegramMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      from: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateIso: new Date().toISOString(),
      status: 'sent',
    };

    setBotMessages((prev) => [...prev, userMsg]);

    // Process intelligence & query matching
    const result = processUserQuery(text);

    setTimeout(() => {
      const botReply: TelegramMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        from: 'bot',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateIso: new Date().toISOString(),
        isHtml: true,
        status: 'delivered',
        reply_markup: {
          inline_keyboard: result.inlineKeyboard,
        },
      };

      setBotMessages((prev) => [...prev, botReply]);

      // If user query found an urgent trending drop, trigger alert banner
      if (result.matchedEvents.length > 0 && (text.includes('trending') || text.includes('alert'))) {
        const topEvent = result.matchedEvents[0];
        handleTriggerAlertForEvent(topEvent, 'Trending Query Alert');
      }
    }, 600);
  };

  const handleAskBotFromTrending = (query: string) => {
    setActiveTab('bot');
    handleSendBotMessage(query);
  };

  const handleToggleFilter = (filterId: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleDeleteFilter = (filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleSaveNewFilter = (newFilterData: Omit<AlertFilter, 'id' | 'createdAt' | 'matchCount'>) => {
    const newFilter: AlertFilter = {
      ...newFilterData,
      id: 'filter-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString().split('T')[0],
      matchCount: 0,
    };
    setFilters((prev) => [newFilter, ...prev]);

    // Test run check against existing events
    const matches = events.filter((e) => {
      const matchesCity = newFilter.city === 'All Cities' || e.city.toLowerCase().includes(newFilter.city.toLowerCase());
      const matchesGenre = e.genres.some((g) => newFilter.genres.includes(g));
      const matchesPrice = newFilter.maxPrice === null || e.priceFrom <= newFilter.maxPrice;
      return matchesCity && matchesGenre && matchesPrice;
    });

    if (matches.length > 0) {
      handleTriggerAlertForEvent(matches[0], newFilter.name);
    }
  };

  const handleTriggerTestAlertFromFilter = (filter: AlertFilter) => {
    const matched = events.find((e) => e.genres.some((g) => filter.genres.includes(g))) || events[0];
    handleTriggerAlertForEvent(matched, filter.name);
  };

  const handleSimulateTicketDrop = () => {
    // Pick a random event and simulate instant drop
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    handleTriggerAlertForEvent(randomEvent, '⚡ Flash Ticket Drop Radar');
  };

  const handleAddCustomFilterFromChat = (custom: {
    name: string;
    city: string;
    genres: EventGenre[];
    maxPrice?: number;
  }) => {
    handleSaveNewFilter({
      name: custom.name,
      enabled: true,
      genres: custom.genres,
      city: custom.city,
      radiusKm: 60,
      dateRangeType: 'this_month',
      maxPrice: custom.maxPrice ?? null,
      eventTypes: ['festival', 'concert'],
      notifyTelegram: true,
      notifyInApp: true,
      silentNotification: false,
    });
  };

  const unreadAlertsCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'midnight'
          ? 'bg-[#18222d] text-slate-100'
          : theme === 'light'
          ? 'bg-slate-100 text-slate-900'
          : 'bg-[#0e1621] text-slate-100'
      }`}
    >
      {/* Floating Push Alert Banner */}
      <PushAlertBanner
        notification={activeBanner}
        onDismiss={() => setActiveBanner(null)}
        onViewEvent={(eventId) => {
          setActiveBanner(null);
          const found = events.find((e) => e.id === eventId);
          if (found) setSelectedEventModal(found);
        }}
        botUsername={telegramConfig.botUsername}
      />

      {/* Main Container: Full viewport or Mobile Frame Mockup */}
      <div
        className={`mx-auto transition-all ${
          isMobileFramed
            ? 'max-w-[430px] my-4 rounded-[42px] border-8 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden min-h-[850px] relative bg-[#0e1621]'
            : 'max-w-md w-full'
        }`}
      >
        {/* Telegram App Header */}
        <TelegramHeader
          config={telegramConfig}
          onOpenSettings={() => setIsConfigModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isMobileFramed={isMobileFramed}
          onToggleFrame={() => setIsMobileFramed(!isMobileFramed)}
          unreadCount={unreadAlertsCount}
        />

        {/* Telegram Connection Alert Banner */}
        {!telegramConfig.isConnected && (
          <div
            onClick={() => setIsConfigModalOpen(true)}
            className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-amber-500/25 transition-all text-xs text-amber-300 select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="font-semibold">Telegram API Not Connected</span>
            </div>
            <span className="text-[11px] font-bold text-amber-200 underline underline-offset-2">
              Link Bot Token →
            </span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <main className="min-h-[calc(100vh-120px)]">
          {activeTab === 'trending' && (
            <TrendingEventsView
              events={events}
              config={telegramConfig}
              onSelectEvent={(evt) => setSelectedEventModal(evt)}
              onTriggerAlert={(evt) => handleTriggerAlertForEvent(evt, 'Instant User Trigger')}
              onAskBot={handleAskBotFromTrending}
            />
          )}

          {activeTab === 'bot' && (
            <TelegramBotChatView
              messages={botMessages}
              onSendMessage={handleSendBotMessage}
              config={telegramConfig}
              onOpenSettings={() => setIsConfigModalOpen(true)}
              onTriggerAlert={(evt) => handleTriggerAlertForEvent(evt, 'Bot Chat Action')}
              onSelectEvent={(evt) => setSelectedEventModal(evt)}
              onAddCustomFilter={handleAddCustomFilterFromChat}
              apiLogsCount={apiLogs.length}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertFiltersView
              filters={filters}
              events={events}
              onToggleFilter={handleToggleFilter}
              onDeleteFilter={handleDeleteFilter}
              onSaveNewFilter={handleSaveNewFilter}
              onTriggerTestAlert={handleTriggerTestAlertFromFilter}
            />
          )}

          {activeTab === 'radar' && (
            <LiveRadarView
              events={events}
              notifications={notifications}
              config={telegramConfig}
              onSelectEvent={(evt) => setSelectedEventModal(evt)}
              onSimulateTicketDrop={handleSimulateTicketDrop}
              onResendNotification={(notif) => {
                const found = events.find((e) => e.id === notif.eventId);
                if (found) handleTriggerAlertForEvent(found, notif.filterName);
              }}
            />
          )}

          {activeTab === 'api' && (
            <TelegramApiConfigModal
              config={telegramConfig}
              onUpdateConfig={(updated) => setTelegramConfig((prev) => ({ ...prev, ...updated }))}
              logs={apiLogs}
              onClearLogs={() => telegramBotService.clearLogs()}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNavBar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'alerts' || tab === 'radar') {
              // mark notifications read
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }
          }}
          unreadAlertsCount={unreadAlertsCount}
          unreadBotMessagesCount={0}
        />
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEventModal}
        config={telegramConfig}
        onClose={() => setSelectedEventModal(null)}
        onTriggerAlert={(evt) => handleTriggerAlertForEvent(evt, 'Detail View Trigger')}
      />

      {/* Settings Modal (when opened from header cog) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar bg-[#17212b] border border-[#242f3d] rounded-3xl p-2 relative shadow-2xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-1 bg-[#242f3d] hover:bg-[#2b3a4a] text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
              >
                Close ✕
              </button>
            </div>
            <TelegramApiConfigModal
              config={telegramConfig}
              onUpdateConfig={(updated) => {
                setTelegramConfig((prev) => ({ ...prev, ...updated }));
              }}
              logs={apiLogs}
              onClearLogs={() => telegramBotService.clearLogs()}
              onClose={() => setIsConfigModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

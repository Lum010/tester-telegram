import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  Flame,
  Bell,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { ConcertEvent, EventGenre, TelegramConfig } from '../types';
import { ALL_GENRES, POPULAR_CITIES } from '../data/mockEvents';
import { soundService } from '../services/soundAndHaptics';

interface TrendingEventsViewProps {
  events: ConcertEvent[];
  config: TelegramConfig;
  onSelectEvent: (event: ConcertEvent) => void;
  onTriggerAlert: (event: ConcertEvent) => void;
  onAskBot: (query: string) => void;
  onOpenNewFilterForEvent?: (event: ConcertEvent) => void;
}

export const TrendingEventsView: React.FC<TrendingEventsViewProps> = ({
  events,
  config,
  onSelectEvent,
  onTriggerAlert,
  onAskBot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedType, setSelectedType] = useState<'all' | 'festival' | 'concert'>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'weekend' | 'month'>('all');
  const [alertSentMap, setAlertSentMap] = useState<Record<string, boolean>>({});

  // Quick prompt chips
  const quickPrompts = [
    { label: '🔥 Trending This Month', query: '/trending' },
    { label: 'Berlin Techno 🎧', query: 'techno in berlin' },
    { label: '🎪 Big Festivals', query: '/festivals' },
    { label: 'London Indie Gigs 🎸', query: 'indie rock in london' },
    { label: 'Under $100 🏷️', query: 'events under 100' },
  ];

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Type filter
      if (selectedType !== 'all' && e.type !== selectedType) return false;

      // Genre filter
      if (selectedGenre !== 'All' && !e.genres.includes(selectedGenre as EventGenre)) {
        return false;
      }

      // City filter
      if (selectedCity !== 'All Cities' && e.city !== selectedCity) {
        return false;
      }

      // Timeframe filter
      if (selectedTimeframe === 'weekend') {
        const isWeekend = e.displayDate.toLowerCase().includes('weekend') || e.displayDate.includes('Oct 09') || e.displayDate.includes('Oct 10') || e.displayDate.includes('Oct 16');
        if (!isWeekend) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesArtists = e.artists.some((a) => a.toLowerCase().includes(q));
        const matchesVenue = e.venue.toLowerCase().includes(q);
        const matchesCity = e.city.toLowerCase().includes(q);
        const matchesGenre = e.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtists && !matchesVenue && !matchesCity && !matchesGenre) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedType, selectedGenre, selectedCity, selectedTimeframe, searchQuery]);

  const handleInstantAlert = (e: React.MouseEvent, event: ConcertEvent) => {
    e.stopPropagation();
    soundService.playTelegramChime();
    setAlertSentMap((prev) => ({ ...prev, [event.id]: true }));
    onTriggerAlert(event);
    setTimeout(() => {
      setAlertSentMap((prev) => ({ ...prev, [event.id]: false }));
    }, 4000);
  };

  const handleShareTelegram = (e: React.MouseEvent, event: ConcertEvent) => {
    e.stopPropagation();
    soundService.triggerHaptic([15]);
    const text = `Check out ${event.title} in ${event.city} on PulseFest! 🎟️`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(event.ticketUrl)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#798b9b]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search artist, festival, venue, or genre..."
          className="w-full bg-[#17212b] border border-[#242f3d] rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#798b9b] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#798b9b] hover:text-white px-1.5 py-0.5 rounded-full bg-[#242f3d]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Prompts Carousel for Telegram Bot Query */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 text-[11px] text-sky-400 font-semibold px-2 py-1 bg-sky-500/10 rounded-lg flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Bot:</span>
        </div>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundService.triggerHaptic([15]);
              onAskBot(p.query);
            }}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-[#1e2c3a] text-slate-300 hover:text-white hover:bg-sky-600/30 border border-[#242f3d] transition-all active:scale-95"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filter Selector Row */}
      <div className="space-y-2 bg-[#17212b]/60 p-3 rounded-2xl border border-[#242f3d]">
        <div className="flex items-center justify-between text-xs text-[#798b9b] px-0.5">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            Filter Radar Feed
          </span>
          <span>{filteredEvents.length} events found</span>
        </div>

        {/* Event Type Toggle (All / Festivals / Concerts) */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0e1621] p-1 rounded-xl">
          <button
            onClick={() => setSelectedType('all')}
            className={`py-1 text-xs font-medium rounded-lg transition-all ${
              selectedType === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            All Live Shows
          </button>
          <button
            onClick={() => setSelectedType('festival')}
            className={`py-1 text-xs font-medium rounded-lg transition-all ${
              selectedType === 'festival'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            🎪 Festivals
          </button>
          <button
            onClick={() => setSelectedType('concert')}
            className={`py-1 text-xs font-medium rounded-lg transition-all ${
              selectedType === 'concert'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            ⚡ Concerts
          </button>
        </div>

        {/* City and Date Pickers */}
        <div className="grid grid-cols-2 gap-2">
          {/* City select */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#0e1621] text-xs text-white border border-[#242f3d] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  📍 {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe select */}
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'all' | 'weekend' | 'month')}
              className="w-full bg-[#0e1621] text-xs text-white border border-[#242f3d] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="all">🗓️ All Dates</option>
              <option value="weekend">🎉 This Weekend</option>
              <option value="month">🍂 This Month (October)</option>
            </select>
          </div>
        </div>

        {/* Genre Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedGenre('All')}
            className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all font-medium ${
              selectedGenre === 'All'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'bg-[#0e1621] text-[#798b9b] hover:text-slate-300 border border-[#242f3d]'
            }`}
          >
            All Genres
          </button>
          {ALL_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 transition-all font-medium ${
                selectedGenre === g
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'bg-[#0e1621] text-[#798b9b] hover:text-slate-300 border border-[#242f3d]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#17212b]/50 rounded-2xl border border-[#242f3d]">
            <Flame className="w-10 h-10 text-[#798b9b] mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-white mb-1">No matching events found</h3>
            <p className="text-xs text-[#798b9b] max-w-xs mx-auto mb-4">
              Try loosening your filters or ask our Telegram Bot for custom suggestions.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setSelectedCity('All Cities');
                setSelectedType('all');
                setSelectedTimeframe('all');
              }}
              className="px-4 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-semibold hover:bg-sky-600 transition-all shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isAlertSent = alertSentMap[event.id];
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="group relative bg-[#17212b] hover:bg-[#1e2c3a] border border-[#242f3d] hover:border-sky-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shadow-md hover:shadow-sky-500/10 active:scale-[0.99]"
              >
                {/* Event Poster Header */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      {event.isTrending && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-slate-950 text-[11px] font-extrabold rounded-md shadow-lg">
                          <Flame className="w-3 h-3 fill-slate-950" />
                          TRENDING
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold rounded-md border border-white/10">
                        {event.type === 'festival' ? '🎪 Festival' : '⚡ Concert'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 bg-emerald-500/90 text-white text-[10px] font-bold rounded-md backdrop-blur-md">
                      {event.ticketStatus}
                    </span>
                  </div>

                  {/* Price Tag Floating bottom right on poster */}
                  <div className="absolute bottom-2.5 right-3 bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-xl text-right">
                    <span className="text-[10px] text-[#798b9b] block leading-none">From</span>
                    <span className="text-sm font-black text-emerald-400">
                      {event.currency} {event.priceFrom}
                    </span>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-xs text-sky-400 font-medium line-clamp-1 mt-0.5">
                      {event.headliners.join(' • ')}
                    </p>
                  </div>

                  {/* Date & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#798b9b]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="truncate">{event.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">
                        {event.venue}, {event.city}
                      </span>
                    </div>
                  </div>

                  {/* Genre Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {event.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-[#0e1621] text-slate-300 border border-[#242f3d]"
                      >
                        {g}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 text-[11px] rounded-md bg-[#0e1621] text-[#798b9b]">
                      👥 {event.attendanceEstimate}
                    </span>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2 border-t border-[#242f3d] flex items-center justify-between gap-2">
                    {/* Instant Telegram Alert Button */}
                    <button
                      onClick={(e) => handleInstantAlert(e, event)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md ${
                        isAlertSent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                      }`}
                    >
                      {isAlertSent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Pushed to Telegram!</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>Push Alert to TG</span>
                        </>
                      )}
                    </button>

                    {/* Share to Telegram */}
                    <button
                      onClick={(e) => handleShareTelegram(e, event)}
                      aria-label="Share event on Telegram"
                      className="p-2 rounded-xl bg-[#242f3d] hover:bg-[#2b3a4a] text-slate-300 hover:text-white transition-all active:scale-95"
                      title="Share to Telegram chat"
                    >
                      <Share2 className="w-4 h-4 text-sky-400" />
                    </button>

                    {/* Direct Ticket Link */}
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 py-2 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2b3a4a] text-slate-200 text-xs font-semibold transition-all"
                    >
                      <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tickets</span>
                      <ExternalLink className="w-3 h-3 text-[#798b9b]" />
                    </a>
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

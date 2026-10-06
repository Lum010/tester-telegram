import React, { useState } from 'react';
import {
  Plus,
  Bell,
  Trash2,
  Sliders,
  Check,
  Zap,
  MapPin,
  Calendar,
  DollarSign,
  Radio,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import { AlertFilter, EventGenre, DateRangePreset, ConcertEvent } from '../types';
import { ALL_GENRES, POPULAR_CITIES } from '../data/mockEvents';
import { soundService } from '../services/soundAndHaptics';

interface AlertFiltersViewProps {
  filters: AlertFilter[];
  events: ConcertEvent[];
  onToggleFilter: (id: string) => void;
  onDeleteFilter: (id: string) => void;
  onSaveNewFilter: (filter: Omit<AlertFilter, 'id' | 'createdAt' | 'matchCount'>) => void;
  onTriggerTestAlert: (filter: AlertFilter) => void;
}

export const AlertFiltersView: React.FC<AlertFiltersViewProps> = ({
  filters,
  events,
  onToggleFilter,
  onDeleteFilter,
  onSaveNewFilter,
  onTriggerTestAlert,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  // New filter form state
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<EventGenre[]>(['Electronic', 'Techno']);
  const [city, setCity] = useState('All Singapore');
  const [radiusKm, setRadiusKm] = useState(15);
  const [dateRangeType, setDateRangeType] = useState<DateRangePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(150);
  const [eventTypes, setEventTypes] = useState<('festival' | 'concert')[]>(['festival', 'concert']);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [silentNotification, setSilentNotification] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  const toggleGenre = (genre: EventGenre) => {
    soundService.triggerHaptic([10]);
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleUseLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      alert('Geolocation not supported in this browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        soundService.triggerHaptic([20]);
        setCity('Current GPS Location');
      },
      () => {
        setLocatingUser(false);
        // Fallback to Singapore central hub
        setCity('All Singapore');
      },
      { timeout: 5000 }
    );
  };

  const handleCreateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playTelegramChime();

    onSaveNewFilter({
      name: name.trim() || `${selectedGenres.join('/')} Radar in ${city}`,
      enabled: true,
      genres: selectedGenres,
      city,
      radiusKm,
      dateRangeType,
      customStartDate: dateRangeType === 'custom' ? customStartDate : undefined,
      customEndDate: dateRangeType === 'custom' ? customEndDate : undefined,
      maxPrice,
      eventTypes,
      notifyTelegram,
      notifyInApp,
      silentNotification,
    });

    setIsCreating(false);
    // Reset defaults
    setName('');
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 space-y-4">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-sky-900/40 via-[#17212b] to-[#1e2c3a] p-4 rounded-2xl border border-sky-500/20 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">Custom Alert Filters</h2>
            </div>
            <p className="text-xs text-[#798b9b] mt-1 max-w-xs">
              Configure real-time radar triggers. When an event matches your genres, location, and dates, you get instant Telegram pushes.
            </p>
          </div>

          <button
            onClick={() => {
              soundService.triggerHaptic([20]);
              setIsCreating(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Alert</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#242f3d] text-center text-xs">
          <div>
            <span className="block text-sm font-extrabold text-white">
              {filters.filter((f) => f.enabled).length}
            </span>
            <span className="text-[10px] text-[#798b9b]">Active Rules</span>
          </div>
          <div>
            <span className="block text-sm font-extrabold text-sky-400">
              {events.length}
            </span>
            <span className="text-[10px] text-[#798b9b]">Monitored Shows</span>
          </div>
          <div>
            <span className="block text-sm font-extrabold text-emerald-400">
              ⚡ ~3s
            </span>
            <span className="text-[10px] text-[#798b9b]">Push Latency</span>
          </div>
        </div>
      </div>

      {/* New Filter Modal / Drawer */}
      {isCreating && (
        <div className="bg-[#17212b] border border-sky-500/40 rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-[#242f3d] pb-2.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Configure New Alert Filter</h3>
            </div>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-[#798b9b] hover:text-white p-1 rounded-lg bg-[#242f3d]"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateFilter} className="space-y-3.5">
            {/* Filter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filter Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., London Weekend Indie & Techno"
                className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-xs text-white placeholder-[#798b9b] focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Event Type Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Types
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (eventTypes.includes('festival')) {
                      if (eventTypes.length > 1) setEventTypes(eventTypes.filter((t) => t !== 'festival'));
                    } else {
                      setEventTypes([...eventTypes, 'festival']);
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    eventTypes.includes('festival')
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-[#0e1621] border-[#242f3d] text-[#798b9b]'
                  }`}
                >
                  🎪 Music Festivals
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (eventTypes.includes('concert')) {
                      if (eventTypes.length > 1) setEventTypes(eventTypes.filter((t) => t !== 'concert'));
                    } else {
                      setEventTypes([...eventTypes, 'concert']);
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    eventTypes.includes('concert')
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-[#0e1621] border-[#242f3d] text-[#798b9b]'
                  }`}
                >
                  ⚡ Live Concerts
                </button>
              </div>
            </div>

            {/* Genres Multi-select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Genres to Track ({selectedGenres.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1 bg-[#0e1621] rounded-xl border border-[#242f3d]">
                {ALL_GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-[#17212b] text-[#798b9b] hover:text-white border border-[#242f3d]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location & Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Target Location & Radius
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locatingUser}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{locatingUser ? 'Locating...' : 'Use My GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      📍 {c.name}
                    </option>
                  ))}
                  {city === 'Current GPS Location' && (
                    <option value="Current GPS Location">📍 Current GPS Location</option>
                  )}
                </select>

                <div className="flex items-center gap-2 bg-[#0e1621] border border-[#242f3d] rounded-xl px-2.5 py-1">
                  <span className="text-[11px] text-[#798b9b] whitespace-nowrap">Radius:</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-sky-400 whitespace-nowrap">
                    {radiusKm}km
                  </span>
                </div>
              </div>
            </div>

            {/* Date Range Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Date Range Filter
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'any', label: 'Anytime' },
                  { id: 'this_weekend', label: 'This Weekend' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'next_3_months', label: 'Next 3 Mo' },
                  { id: 'custom', label: 'Custom Dates' },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setDateRangeType(d.id as DateRangePreset)}
                    className={`py-1 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      dateRangeType === d.id
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-[#0e1621] border-[#242f3d] text-[#798b9b]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {dateRangeType === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[#798b9b] block">From Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#798b9b] block">To Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Max Budget Limit */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Max Ticket Price Ceiling</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {maxPrice === null ? 'Any Price' : `S$ ${maxPrice}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={maxPrice ?? 400}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMaxPrice(val >= 400 ? null : val);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#798b9b]">
                <span>S$ 30 (Club)</span>
                <span>S$ 150 (Concert)</span>
                <span>S$ 400+ (VIP)</span>
              </div>
            </div>

            {/* Notification Delivery Channels */}
            <div className="p-2.5 bg-[#0e1621] rounded-xl border border-[#242f3d] space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Push Notification Delivery
              </span>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <span className="text-sky-400">✈️</span>
                  <span>Telegram Bot Message (/sendMessage)</span>
                </span>
                <input
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="w-4 h-4 accent-sky-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>In-App Push Banner & Audio Chime</span>
                </span>
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Silent Telegram Push (disable_notification)</span>
                </span>
                <input
                  type="checkbox"
                  checked={silentNotification}
                  onChange={(e) => setSilentNotification(e.target.checked)}
                  className="w-4 h-4 accent-slate-500"
                />
              </label>
            </div>

            {/* Form Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#798b9b] hover:text-white bg-[#0e1621] border border-[#242f3d]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                Save & Activate Filter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Filters List */}
      <div className="space-y-3">
        {filters.length === 0 ? (
          <div className="text-center py-10 bg-[#17212b]/40 rounded-2xl border border-[#242f3d] p-4">
            <Bell className="w-8 h-8 text-[#798b9b] mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-white">No Active Radar Filters</h3>
            <p className="text-xs text-[#798b9b] max-w-xs mx-auto mb-3">
              Create your first alert filter to get instant notifications when festivals or concerts drop tickets!
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
            >
              + Create Filter Now
            </button>
          </div>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                filter.enabled
                  ? 'bg-[#17212b] border-[#242f3d] hover:border-sky-500/40 shadow-md'
                  : 'bg-[#17212b]/50 border-[#242f3d]/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{filter.name}</h4>
                    {filter.enabled && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>

                  {/* Filter Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0e1621] text-sky-400 border border-[#242f3d]">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>
                        {filter.city} ({filter.radiusKm}km)
                      </span>
                    </span>

                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0e1621] text-slate-300 border border-[#242f3d]">
                      <Calendar className="w-3 h-3 text-sky-400" />
                      <span>{filter.dateRangeType.replace('_', ' ')}</span>
                    </span>

                    {filter.maxPrice && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0e1621] text-emerald-400 border border-[#242f3d]">
                        <DollarSign className="w-3 h-3" />
                        <span>Max S$ {filter.maxPrice}</span>
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filter.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-medium"
                      >
                        #{g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      soundService.triggerHaptic([10]);
                      onToggleFilter(filter.id);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      filter.enabled ? 'bg-sky-500' : 'bg-[#242f3d]'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        filter.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Bar for this filter */}
              <div className="mt-3 pt-2.5 border-t border-[#242f3d] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#798b9b]">
                  Dispatches to: <b>Telegram Bot</b> {filter.silentNotification && '(Silent)'}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Test Push Alert Button */}
                  <button
                    onClick={() => onTriggerTestAlert(filter)}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 font-semibold active:scale-95 transition-all text-xs"
                    title="Send immediate test alert"
                  >
                    <Zap className="w-3 h-3 text-sky-400" />
                    <span>Test Push</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      soundService.triggerHaptic([20]);
                      onDeleteFilter(filter.id);
                    }}
                    className="p-1 rounded-lg text-[#798b9b] hover:text-rose-400 hover:bg-[#242f3d] transition-all"
                    title="Delete filter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

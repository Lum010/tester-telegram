import React from 'react';
import { Volume2, VolumeX, Settings, ShieldCheck, Radio, Smartphone, Maximize2 } from 'lucide-react';
import { TelegramConfig } from '../types';

interface TelegramHeaderProps {
  config: TelegramConfig;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: 'dark' | 'midnight' | 'light';
  onToggleTheme: () => void;
  isMobileFramed: boolean;
  onToggleFrame: () => void;
  unreadCount?: number;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  config,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  isMobileFramed,
  onToggleFrame,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#17212b]/95 backdrop-blur-md border-b border-[#242f3d] px-4 py-2.5 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left: Bot Avatar & Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 via-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <span className="text-lg font-black tracking-tight">PF</span>
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#17212b] rounded-full ${
                config.isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            ></span>
          </div>

          <div className="min-w-0 cursor-pointer" onClick={onOpenSettings} title="Click to view Telegram API connection">
            <div className="flex items-center gap-1">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">
                PulseFest Radar
              </h1>
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${config.isConnected ? 'text-sky-400' : 'text-amber-400'}`} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#798b9b]">
              <span className="text-sky-400 font-mono text-[11px] truncate max-w-[120px]">
                @{config.botUsername || 'PulseFestRadarBot'}
              </span>
              <span>•</span>
              {config.isConnected ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Radio className="w-3 h-3 animate-pulse" />
                  API Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium underline underline-offset-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Not Connected (Link Bot)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-lg text-[#798b9b] hover:text-white hover:bg-[#242f3d] active:scale-95 transition-all"
            title={soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Theme switcher */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-[#798b9b] hover:text-white hover:bg-[#242f3d] active:scale-95 transition-all text-xs font-semibold"
            title={`Current theme: ${theme}`}
          >
            {theme === 'dark' ? '🌙' : theme === 'midnight' ? '🌌' : '☀️'}
          </button>

          {/* Mobile frame toggle for desktop viewing */}
          <button
            onClick={onToggleFrame}
            aria-label="Toggle phone mockup preview frame"
            className="hidden sm:flex p-2 rounded-lg text-[#798b9b] hover:text-white hover:bg-[#242f3d] active:scale-95 transition-all"
            title={isMobileFramed ? 'Switch to Full Width View' : 'Switch to Mobile Frame'}
          >
            {isMobileFramed ? (
              <Maximize2 className="w-4 h-4 text-slate-300" />
            ) : (
              <Smartphone className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Telegram Bot API Configuration"
            className="relative p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 active:scale-95 transition-all border border-sky-500/20"
            title="Telegram Bot API Settings"
          >
            <Settings className="w-4 h-4" />
            {!config.isConnected && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

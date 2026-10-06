import React from 'react';
import { Flame, MessageSquare, Bell, Radio, Send } from 'lucide-react';
import { soundService } from '../services/soundAndHaptics';

export type AppTab = 'trending' | 'bot' | 'alerts' | 'radar' | 'api';

interface BottomNavBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  unreadAlertsCount: number;
  unreadBotMessagesCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  unreadAlertsCount,
  unreadBotMessagesCount,
}) => {
  const handleTabClick = (tab: AppTab) => {
    soundService.triggerHaptic([15]);
    onChangeTab(tab);
  };

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'trending',
      label: 'Trending',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'bot',
      label: 'TG Bot',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadBotMessagesCount,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadAlertsCount,
    },
    {
      id: 'radar',
      label: 'Live Radar',
      icon: <Radio className="w-5 h-5" />,
    },
    {
      id: 'api',
      label: 'Bot Link',
      icon: <Send className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#17212b]/95 backdrop-blur-lg border-t border-[#242f3d] safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-[#798b9b] hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-lg transition-transform ${
                    isActive ? 'scale-110 bg-sky-500/15 text-sky-400' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#17212b] animate-bounce">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-5 h-0.5 bg-sky-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

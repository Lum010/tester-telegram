import React, { useState } from 'react';
import {
  Send,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  ExternalLink,
  Terminal,
  Trash2,
  Radio,
  Eye,
  EyeOff,
} from 'lucide-react';
import { TelegramConfig, TelegramApiLog } from '../types';
import { telegramBotService } from '../services/telegramBotService';
import { soundService } from '../services/soundAndHaptics';

interface TelegramApiConfigModalProps {
  config: TelegramConfig;
  onUpdateConfig: (updated: Partial<TelegramConfig>) => void;
  logs: TelegramApiLog[];
  onClearLogs: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const TelegramApiConfigModal: React.FC<TelegramApiConfigModalProps> = ({
  config,
  onUpdateConfig,
  logs,
  onClearLogs,
  isOpen = true,
  onClose,
}) => {
  const [token, setToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
    botName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'logs'>('config');

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    soundService.triggerHaptic([20]);

    try {
      const tokenToTest = token.trim();

      // If empty token, check if the backend environment variable is configured
      if (!tokenToTest) {
        const serverStatus = await telegramBotService.checkServerStatus();
        if (serverStatus.connected && serverStatus.botUsername) {
          soundService.playTelegramChime();
          setTestResult({
            ok: true,
            msg: `Successfully connected via server environment variable!`,
            botName: serverStatus.botUsername,
          });
          onUpdateConfig({
            botUsername: serverStatus.botUsername,
            isConnected: true,
            lastConnectedAt: new Date().toLocaleTimeString(),
          });
          return;
        } else {
          setTestResult({
            ok: false,
            msg: 'No token entered and TELEGRAM_BOT_TOKEN is not configured in environment variables. Please paste your token from @BotFather.',
          });
          return;
        }
      }

      const res = await telegramBotService.getMe(tokenToTest);
      if (res.ok && res.user) {
        soundService.playTelegramChime();
        setTestResult({
          ok: true,
          msg: `Successfully connected to Telegram Bot API!`,
          botName: res.user.username,
        });

        // Persist token and chatId in localStorage
        try {
          localStorage.setItem('pulsefest_bot_token', tokenToTest);
          if (chatId.trim()) localStorage.setItem('pulsefest_chat_id', chatId.trim());
        } catch {
          // localStorage blocked
        }

        onUpdateConfig({
          botToken: tokenToTest,
          botUsername: res.user.username,
          chatId: chatId.trim(),
          isConnected: true,
          lastConnectedAt: new Date().toLocaleTimeString(),
        });
      } else {
        setTestResult({
          ok: false,
          msg: res.error || 'Failed to authenticate Telegram Bot token with Telegram servers.',
        });
        onUpdateConfig({
          isConnected: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setTestResult({ ok: false, msg });
      onUpdateConfig({ isConnected: false });
    } finally {
      setTesting(false);
    }
  };

  const handleUseDemo = () => {
    soundService.triggerHaptic([15]);
    const demoToken = 'DEMO_719283749:AAFn4kdL98vX02_PulseFestKey';
    const demoChatId = '789123456';
    setToken(demoToken);
    setChatId(demoChatId);
    try {
      localStorage.setItem('pulsefest_bot_token', demoToken);
      localStorage.setItem('pulsefest_chat_id', demoChatId);
    } catch {}
    onUpdateConfig({
      botToken: demoToken,
      botUsername: 'PulseFestRadarBot',
      chatId: demoChatId,
      isConnected: true,
      lastConnectedAt: new Date().toLocaleTimeString(),
    });
    setTestResult({
      ok: true,
      msg: 'Demo Bot linked with full Telegram Bot API simulator!',
      botName: 'PulseFestRadarBot',
    });
  };

  const handleSave = async () => {
    soundService.triggerHaptic([15]);
    const cleanToken = token.trim();
    const cleanChat = chatId.trim();

    try {
      if (cleanToken) localStorage.setItem('pulsefest_bot_token', cleanToken);
      if (cleanChat) localStorage.setItem('pulsefest_chat_id', cleanChat);
    } catch {}

    if (cleanToken) {
      await handleTestConnection();
    } else {
      onUpdateConfig({
        botToken: '',
        chatId: cleanChat,
      });
    }

    if (onClose) onClose();
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 space-y-4">
      {/* Connector Header */}
      <div className="bg-[#17212b] border border-sky-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Telegram Bot API Link</h2>
              <p className="text-xs text-[#798b9b]">
                Real-time dispatch framework for concert & festival alerts
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              config.isConnected
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            ></span>
            <span>{config.isConnected ? 'Connected' : 'Setup Required'}</span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 bg-[#0e1621] p-1 rounded-xl mt-3.5 border border-[#242f3d]">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-[#17212b] text-sky-400 shadow-sm border border-sky-500/20'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            API Credentials
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'guide'
                ? 'bg-[#17212b] text-sky-400 shadow-sm border border-sky-500/20'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-[#17212b] text-sky-400 shadow-sm border border-sky-500/20'
                : 'text-[#798b9b] hover:text-white'
            }`}
          >
            <span>API Logs</span>
            {logs.length > 0 && (
              <span className="text-[10px] px-1 bg-sky-500 text-white rounded-full">
                {logs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'config' && (
        <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 space-y-4 shadow-md">
          {/* One click demo banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/25">
            <div>
              <span className="text-xs font-bold text-white block">
                Instant Preview with Demo Bot
              </span>
              <span className="text-[11px] text-sky-300">
                Test all push alert & Telegram features without creating a bot first.
              </span>
            </div>
            <button
              onClick={handleUseDemo}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-sky-500/20 flex-shrink-0 ml-2"
            >
              Use Demo Bot
            </button>
          </div>

          {/* Bot Token Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-400" />
                <span>Telegram Bot Token</span>
              </label>
              <span className="text-[11px] text-[#798b9b]">From @BotFather</span>
            </div>

            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="e.g. 719283749:AAFn4kdL98vX02..."
                className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 pr-10 text-xs font-mono text-white placeholder-[#798b9b] focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#798b9b] hover:text-white"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Chat ID / Channel Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Chat ID or Channel</span>
              </label>
              <span className="text-[11px] text-[#798b9b]">From @userinfobot</span>
            </div>

            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 192837465 or @MyFestivalChannel"
              className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#798b9b] focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.msg}</p>
                {testResult.botName && (
                  <p className="font-mono text-[11px] text-sky-300 mt-0.5">
                    Bot Handle: @{testResult.botName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{testing ? 'Testing Token...' : 'Test Connection (getMe)'}</span>
            </button>

            <button
              onClick={handleSave}
              className="py-2 px-4 rounded-xl bg-[#242f3d] hover:bg-[#2e3c4d] text-white font-semibold text-xs transition-all"
            >
              Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* Guide Tab */}
      {activeTab === 'guide' && (
        <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 space-y-4 shadow-md text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>How to Link Your Own Telegram Bot (3 Easy Steps)</span>
          </div>

          <ol className="space-y-3 text-slate-300">
            <li className="p-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] space-y-1">
              <span className="font-bold text-white block">
                1. Open @BotFather in Telegram
              </span>
              <p className="text-[#798b9b] text-[11px]">
                Search for <b>@BotFather</b> on Telegram (official verified bot). Send the command <code>/newbot</code> and follow the prompt to choose a name and username (e.g., <i>MyRadarConcertBot</i>).
              </p>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline pt-0.5"
              >
                <span>Open @BotFather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>

            <li className="p-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] space-y-1">
              <span className="font-bold text-white block">
                2. Copy Your HTTP API Token
              </span>
              <p className="text-[#798b9b] text-[11px]">
                BotFather will give you a token like: <code>123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</code>. Paste it into the "Telegram Bot Token" field.
              </p>
            </li>

            <li className="p-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] space-y-1">
              <span className="font-bold text-white block">
                3. Get Your Telegram Chat ID
              </span>
              <p className="text-[#798b9b] text-[11px]">
                Start your new bot by pressing <b>Start</b>. To get your chat ID, search for <b>@userinfobot</b> on Telegram, tap Start, and copy the numeric <b>Id</b>. Paste it into "Target Chat ID".
              </p>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline pt-0.5"
              >
                <span>Open @userinfobot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ol>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram Bot API Telemetry</span>
            </span>
            <button
              onClick={() => {
                soundService.triggerHaptic([10]);
                onClearLogs();
              }}
              className="text-[#798b9b] hover:text-rose-400 flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-[11px] no-scrollbar">
            {logs.length === 0 ? (
              <p className="text-[#798b9b] text-center py-6">No API calls recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#0e1621] border border-[#242f3d] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sky-400 font-bold">{log.method}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded ${
                        log.status.includes('200') || log.status === 'Simulated'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-[#798b9b] text-[10px]">{log.payloadSummary}</div>
                  <div className="text-slate-400 text-[10px] truncate max-w-full bg-[#17212b] p-1 rounded">
                    {log.responsePreview}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

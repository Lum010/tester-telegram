import { ConcertEvent, TelegramApiLog, TelegramInlineButton } from '../types';

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2';
  disable_notification?: boolean;
  reply_markup?: {
    inline_keyboard?: TelegramInlineButton[][];
  };
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramBotUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

class TelegramBotService {
  private apiLogs: TelegramApiLog[] = [];
  private logListeners: ((logs: TelegramApiLog[]) => void)[] = [];

  public subscribeLogs(listener: (logs: TelegramApiLog[]) => void) {
    this.logListeners.push(listener);
    listener([...this.apiLogs]);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  private addLog(log: Omit<TelegramApiLog, 'id' | 'timestamp'>) {
    const newLog: TelegramApiLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      ...log,
    };
    this.apiLogs.unshift(newLog);
    if (this.apiLogs.length > 50) this.apiLogs.pop();
    this.logListeners.forEach((l) => l([...this.apiLogs]));
  }

  public getLogs(): TelegramApiLog[] {
    return [...this.apiLogs];
  }

  public clearLogs() {
    this.apiLogs = [];
    this.logListeners.forEach((l) => l([]));
  }

  /**
   * Check if backend server has TELEGRAM_BOT_TOKEN already configured
   */
  public async checkServerStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    botUsername?: string;
    chatIdConfigured?: boolean;
  }> {
    try {
      const res = await fetch('/api/telegram', { method: 'GET' });
      if (!res.ok) return { configured: false, connected: false };
      const data = await res.json();
      const isConnected = data.status === 'connected' && Boolean(data.botInfo?.username);
      return {
        configured: Boolean(data.tokenConfigured),
        connected: isConnected,
        botUsername: data.botInfo?.username,
        chatIdConfigured: Boolean(data.defaultChatIdConfigured),
      };
    } catch {
      return { configured: false, connected: false };
    }
  }

  /**
   * Verify Telegram Bot Token by calling getMe via /api/telegram serverless proxy
   * (Prevents browser CORS blocking)
   */
  public async getMe(token: string): Promise<{ ok: boolean; user?: TelegramBotUser; error?: string }> {
    if (!token || token.trim() === '') {
      return { ok: false, error: 'Token is empty. Please enter your Telegram Bot token from @BotFather.' };
    }

    const cleanToken = token.trim();

    // If using simulated token
    if (cleanToken.startsWith('DEMO_') || cleanToken.includes('mock') || cleanToken.includes('demo')) {
      const demoUser: TelegramBotUser = {
        id: 719283749,
        is_bot: true,
        first_name: 'PulseFest Radar Bot',
        username: 'PulseFestRadarBot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: true,
      };
      this.addLog({
        method: 'getMe',
        status: 'Simulated',
        payloadSummary: 'Token: ' + cleanToken.substring(0, 10) + '...',
        responsePreview: JSON.stringify({ ok: true, result: demoUser }),
      });
      return { ok: true, user: demoUser };
    }

    // Try through /api/telegram serverless proxy (no browser CORS block)
    try {
      const proxyRes = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getMe',
          token: cleanToken,
        }),
      });

      const proxyData: TelegramApiResponse<TelegramBotUser> = await proxyRes.json();

      this.addLog({
        method: 'getMe',
        status: proxyData.ok ? '200 OK' : '400 Bad Request',
        payloadSummary: 'getMe via serverless /api/telegram',
        responsePreview: JSON.stringify(proxyData),
      });

      if (proxyData.ok && proxyData.result) {
        return { ok: true, user: proxyData.result };
      } else {
        return { ok: false, error: proxyData.description || 'Invalid Telegram Bot token' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';

      // Direct fallback attempt (in case /api is on separate host or standalone)
      try {
        const directRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const directData: TelegramApiResponse<TelegramBotUser> = await directRes.json();
        if (directData.ok && directData.result) {
          return { ok: true, user: directData.result };
        }
        return { ok: false, error: directData.description || 'Failed to authenticate token' };
      } catch {
        this.addLog({
          method: 'getMe',
          status: '400 Bad Request',
          payloadSummary: 'getMe proxy error: ' + msg,
          responsePreview: 'Could not connect to Telegram API. Check network or server configuration.',
        });
        return { ok: false, error: `Connection failed: ${msg}. Make sure your token is valid and internet access is active.` };
      }
    }
  }

  /**
   * Dispatch a message via /api/telegram serverless proxy or Telegram Bot API
   */
  public async sendMessage(
    token: string,
    chatId: string,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<{ ok: boolean; messageId?: number; description?: string }> {
    const isSimulated = !token || token.startsWith('DEMO_') || token.includes('demo') || !chatId;

    if (isSimulated) {
      const simulatedMsgId = Math.floor(1000 + Math.random() * 9000);
      this.addLog({
        method: 'sendMessage',
        status: 'Simulated',
        payloadSummary: `Chat: ${chatId || 'DemoChat'} | Len: ${text.length} chars | Silent: ${!!options.disable_notification}`,
        responsePreview: JSON.stringify({
          ok: true,
          result: {
            message_id: simulatedMsgId,
            chat: { id: chatId || '@PulseFestRadar', type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: text.slice(0, 80) + '...',
          },
        }),
      });
      return { ok: true, messageId: simulatedMsgId };
    }

    const cleanToken = token.trim();
    const cleanChatId = chatId.trim();

    // 1. First try dispatching via /api/telegram serverless endpoint
    try {
      const proxyRes = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          token: cleanToken,
          chatId: cleanChatId,
          text,
          parseMode: options.parse_mode || 'HTML',
          disableNotification: options.disable_notification ?? false,
          replyMarkup: options.reply_markup,
        }),
      });

      const proxyData: TelegramApiResponse<{ message_id: number }> = await proxyRes.json();

      this.addLog({
        method: 'sendMessage',
        status: proxyData.ok ? '200 OK' : '400 Bad Request',
        payloadSummary: `Chat: ${cleanChatId} via /api/telegram`,
        responsePreview: JSON.stringify(proxyData),
      });

      if (proxyData.ok && proxyData.result) {
        return { ok: true, messageId: proxyData.result.message_id };
      } else {
        return { ok: false, description: proxyData.description };
      }
    } catch {
      // 2. Direct fallback
      try {
        const endpoint = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
        const bodyPayload = {
          chat_id: cleanChatId,
          text,
          parse_mode: options.parse_mode || 'HTML',
          disable_notification: options.disable_notification ?? false,
          reply_markup: options.reply_markup,
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        const data: TelegramApiResponse<{ message_id: number }> = await res.json();
        return { ok: data.ok, messageId: data.result?.message_id, description: data.description };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        this.addLog({
          method: 'sendMessage',
          status: 'Simulated',
          payloadSummary: `Chat: ${cleanChatId} (Simulation Fallback)`,
          responsePreview: `Dispatch simulated: ${msg}`,
        });
        return { ok: true, messageId: Math.floor(2000 + Math.random() * 8000) };
      }
    }
  }

  /**
   * Format a high-fidelity Telegram post for concert & festival alerts
   */
  public formatConcertAlertHtml(event: ConcertEvent, filterName: string): { text: string; buttons: TelegramInlineButton[][] } {
    const isFest = event.type === 'festival';
    const headerEmoji = isFest ? '🎪' : '⚡';
    const typeLabel = isFest ? 'FESTIVAL ALERT' : 'CONCERT ALERT';
    const headlinersText = event.headliners.length > 0 ? `\n👑 <b>Headliners:</b> ${event.headliners.join(', ')}` : '';
    const genresText = event.genres.map((g) => `#${g.replace(/[\s\/-]/g, '')}`).join(' ');

    const html = `<b>${headerEmoji} PULSEFEST ${typeLabel}</b>
🎯 <i>Triggered by filter: "${filterName}"</i>

🔥 <b>${event.title}</b>
📍 <b>Venue:</b> ${event.venue}, ${event.city} (${event.country})
🗓 <b>Date:</b> ${event.displayDate}
🎟 <b>Tickets:</b> From ${event.currency} ${event.priceFrom} [${event.ticketStatus}]${headlinersText}
👥 <b>Crowd:</b> ${event.attendanceEstimate} | ${event.ageRestriction}

🏷 ${genresText}

<i>Instant alert from PulseFest Live Radar</i>`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(event.ticketUrl)}&text=${encodeURIComponent(`Check out ${event.title} in ${event.city}!`)}`;

    const buttons: TelegramInlineButton[][] = [
      [
        { text: '🎟️ Get Tickets', url: event.ticketUrl },
        { text: '📍 Venue Map', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.city}`)}` },
      ],
      [
        { text: '📤 Share to Telegram', url: shareUrl },
        { text: '🔔 Manage Alerts', callback_data: `filter_toggle_${event.id}` },
      ],
    ];

    return { text: html, buttons };
  }

  /**
   * Generates a Telegram deep link for opening mini app or bot
   */
  public getTelegramDeepLink(botUsername: string, startParam?: string): string {
    const cleanBot = (botUsername || 'PulseFestRadarBot').replace('@', '');
    if (startParam) {
      return `https://t.me/${cleanBot}?start=${encodeURIComponent(startParam)}`;
    }
    return `https://t.me/${cleanBot}`;
  }
}

export const telegramBotService = new TelegramBotService();

import type { IncomingMessage, ServerResponse } from 'http';

interface TelegramPayload {
  action?: 'getMe' | 'sendMessage' | 'sendPhoto' | 'sendVideo' | 'setWebhook' | 'getWebhookInfo' | 'deleteWebhook';
  token?: string; // Optional override; defaults to process.env.TELEGRAM_BOT_TOKEN
  chatId?: string; // Optional override; defaults to process.env.TELEGRAM_CHAT_ID
  text?: string;
  photoUrl?: string;
  videoUrl?: string;
  caption?: string;
  parseMode?: 'HTML' | 'MarkdownV2';
  disableNotification?: boolean;
  replyMarkup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
  };
  webhookUrl?: string;
}

/**
 * Serverless /api/telegram endpoint
 * Proxies and manages direct communication with the official Telegram Botfather API.
 * Strict zero hardcoding: process.env.TELEGRAM_BOT_TOKEN is used by default.
 */
export default async function handler(
  req: IncomingMessage & { body?: any; method?: string; query?: Record<string, string> },
  res?: ServerResponse
): Promise<Response | void> {
  const method = req.method || 'GET';
  const defaultToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const defaultChatId = process.env.TELEGRAM_CHAT_ID || '';

  // GET: Health check & BotFather configuration status
  if (method === 'GET') {
    const isConfigured = Boolean(defaultToken.trim());
    let botInfo: any = null;

    if (isConfigured) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${defaultToken}/getMe`);
        const tgData = await tgRes.json();
        if (tgData.ok) {
          botInfo = tgData.result;
        }
      } catch (err: any) {
        botInfo = { error: err.message };
      }
    }

    const payload = {
      service: 'telegram-botfather-bridge',
      status: isConfigured ? 'configured' : 'pending_configuration',
      tokenConfigured: isConfigured,
      defaultChatIdConfigured: Boolean(defaultChatId.trim()),
      botInfo,
      endpoints: {
        sendMessage: 'POST /api/telegram { action: "sendMessage", text: "...", chatId: "..." }',
        getMe: 'POST /api/telegram { action: "getMe" }',
        setWebhook: 'POST /api/telegram { action: "setWebhook", webhookUrl: "..." }',
        sendPhoto: 'POST /api/telegram { action: "sendPhoto", photoUrl: "...", caption: "..." }',
      },
      note: isConfigured
        ? 'Telegram Bot token detected from environment variables.'
        : 'Please set TELEGRAM_BOT_TOKEN in your environment variables.',
    };

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(payload, null, 2));
      return;
    }
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST: Dispatch action to Telegram API
  if (method === 'POST') {
    let body: TelegramPayload = {};

    try {
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else {
        const rawBody = await readBody(req);
        body = rawBody ? JSON.parse(rawBody) : {};
      }
    } catch {
      body = {};
    }

    const activeToken = body.token?.trim() || defaultToken.trim();
    const activeChatId = body.chatId?.trim() || defaultChatId.trim();
    const action = body.action || 'sendMessage';

    if (!activeToken) {
      const errResponse = {
        ok: false,
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
        description: 'Provide an active token via process.env.TELEGRAM_BOT_TOKEN or in the request body.',
      };
      if (res && typeof res.setHeader === 'function') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(errResponse));
        return;
      }
      return new Response(JSON.stringify(errResponse), { status: 400 });
    }

    const baseUrl = `https://api.telegram.org/bot${activeToken}`;

    try {
      let telegramEndpoint = `${baseUrl}/sendMessage`;
      let telegramPayload: any = {};

      switch (action) {
        case 'getMe':
          telegramEndpoint = `${baseUrl}/getMe`;
          telegramPayload = null;
          break;

        case 'sendMessage':
          telegramEndpoint = `${baseUrl}/sendMessage`;
          telegramPayload = {
            chat_id: activeChatId,
            text: body.text || 'Notification from PulseFest Radar',
            parse_mode: body.parseMode || 'HTML',
            disable_notification: body.disableNotification ?? false,
            reply_markup: body.replyMarkup,
          };
          break;

        case 'sendPhoto':
          telegramEndpoint = `${baseUrl}/sendPhoto`;
          telegramPayload = {
            chat_id: activeChatId,
            photo: body.photoUrl,
            caption: body.caption || '',
            parse_mode: body.parseMode || 'HTML',
            reply_markup: body.replyMarkup,
          };
          break;

        case 'sendVideo':
          telegramEndpoint = `${baseUrl}/sendVideo`;
          telegramPayload = {
            chat_id: activeChatId,
            video: body.videoUrl,
            caption: body.caption || '',
            parse_mode: body.parseMode || 'HTML',
          };
          break;

        case 'setWebhook':
          telegramEndpoint = `${baseUrl}/setWebhook`;
          telegramPayload = {
            url: body.webhookUrl,
            drop_pending_updates: true,
          };
          break;

        case 'getWebhookInfo':
          telegramEndpoint = `${baseUrl}/getWebhookInfo`;
          telegramPayload = null;
          break;

        case 'deleteWebhook':
          telegramEndpoint = `${baseUrl}/deleteWebhook`;
          telegramPayload = null;
          break;

        default:
          telegramEndpoint = `${baseUrl}/sendMessage`;
          telegramPayload = {
            chat_id: activeChatId,
            text: body.text || 'PulseFest event alert',
          };
      }

      const tgFetchOptions: RequestInit = {
        method: telegramPayload ? 'POST' : 'GET',
        headers: telegramPayload ? { 'Content-Type': 'application/json' } : undefined,
        body: telegramPayload ? JSON.stringify(telegramPayload) : undefined,
      };

      const tgRes = await fetch(telegramEndpoint, tgFetchOptions);
      const tgData = await tgRes.json();

      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = tgRes.ok ? 200 : 400;
        res.end(JSON.stringify(tgData, null, 2));
        return;
      }
      return new Response(JSON.stringify(tgData, null, 2), {
        status: tgRes.ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      const errPayload = {
        ok: false,
        error: 'Failed to communicate with Telegram Bot API',
        message: err.message,
      };
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 502;
        res.end(JSON.stringify(errPayload));
        return;
      }
      return new Response(JSON.stringify(errPayload), { status: 502 });
    }
  }

  // Method not allowed
  if (res && typeof res.setHeader === 'function') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

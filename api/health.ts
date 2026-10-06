import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  service: string;
  version: string;
  environment: {
    telegramBotConfigured: boolean;
    telegramChatIdConfigured: boolean;
    soraApiConfigured: boolean;
    geminiApiConfigured: boolean;
    nodeEnv: string;
  };
  system: {
    nodeVersion: string;
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
}

/**
 * Serverless /api/health endpoint
 * Returns diagnostic metrics and config flags without leaking secrets.
 */
export default async function handler(
  req: IncomingMessage & { method?: string; query?: Record<string, string> },
  res?: ServerResponse
): Promise<Response | void> {
  const uptimeSeconds = Math.floor(process.uptime ? process.uptime() : 0);
  const mem = process.memoryUsage ? process.memoryUsage() : { rss: 0, heapTotal: 0, heapUsed: 0 };

  const data: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    service: 'pulsefest-telegram-botfather-bridge',
    version: '1.0.0',
    environment: {
      telegramBotConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim().length > 0),
      telegramChatIdConfigured: Boolean(process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_CHAT_ID.trim().length > 0),
      soraApiConfigured: Boolean(process.env.SORA_API_KEY && process.env.SORA_API_KEY.trim().length > 0),
      geminiApiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      },
    },
  };

  // If invoked in standard Node/Express serverless environment with (req, res)
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify(data, null, 2));
    return;
  }

  // If invoked in Web API environment (Fetch API / Edge functions)
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Named export for frameworks supporting export async function GET()
export async function GET(request?: Request): Promise<Response> {
  const result = await handler(request as unknown as IncomingMessage);
  return result as Response;
}

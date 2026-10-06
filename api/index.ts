import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(
  req: IncomingMessage,
  res?: ServerResponse
): Promise<Response | void> {
  const directory = {
    service: 'PulseFest Serverless API Bridge',
    description: 'Serverless connection endpoints linking to Telegram Botfather API',
    endpoints: [
      {
        path: '/api/health',
        method: 'GET',
        description: 'Serverless health, uptime, and configuration diagnostics (no leaked keys)',
      },
      {
        path: '/api/telegram',
        methods: ['GET', 'POST'],
        description: 'Direct serverless connector to Telegram Botfather API (sendMessage, sendPhoto, sendVideo, getMe, setWebhook)',
        actions: ['getMe', 'sendMessage', 'sendPhoto', 'sendVideo', 'setWebhook', 'getWebhookInfo', 'deleteWebhook'],
      },
    ],
    environmentVariables: {
      TELEGRAM_BOT_TOKEN: 'Official Bot Token obtained from @BotFather',
      TELEGRAM_CHAT_ID: 'Target Telegram Chat ID or Channel Handle',
    },
  };

  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(directory, null, 2));
    return;
  }

  return new Response(JSON.stringify(directory, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

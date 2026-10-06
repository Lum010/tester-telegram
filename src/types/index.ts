export type EventGenre =
  | 'Electronic'
  | 'Techno'
  | 'House'
  | 'Indie'
  | 'Rock'
  | 'Hip-Hop'
  | 'R&B'
  | 'Pop'
  | 'Metal'
  | 'Jazz'
  | 'Latin'
  | 'Folk / Acoustic';

export type TicketStatus =
  | 'Selling Fast'
  | 'Presale Active'
  | 'Early Bird'
  | 'General Available'
  | 'Few Left'
  | 'Sold Out'
  | 'VIP Available';

export interface ConcertEvent {
  id: string;
  title: string;
  type: 'festival' | 'concert';
  artists: string[];
  headliners: string[];
  genres: EventGenre[];
  venue: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string; // ISO date 'YYYY-MM-DD'
  displayDate: string;
  priceFrom: number;
  currency: string;
  ticketStatus: TicketStatus;
  ticketUrl: string;
  posterUrl: string;
  description: string;
  popularityScore: number; // 1-100
  attendanceEstimate: string;
  isTrending: boolean;
  ageRestriction: string;
  matchScore?: number;
}

export type DateRangePreset =
  | 'any'
  | 'this_weekend'
  | 'this_week'
  | 'this_month'
  | 'next_3_months'
  | 'custom';

export interface AlertFilter {
  id: string;
  name: string;
  enabled: boolean;
  genres: EventGenre[];
  city: string;
  radiusKm: number;
  dateRangeType: DateRangePreset;
  customStartDate?: string;
  customEndDate?: string;
  maxPrice: number | null; // null for any price
  eventTypes: ('festival' | 'concert')[];
  notifyTelegram: boolean;
  notifyInApp: boolean;
  silentNotification: boolean; // Telegram disable_notification
  createdAt: string;
  lastTriggered?: string;
  matchCount: number;
}

export interface TelegramConfig {
  botToken: string;
  botUsername: string;
  chatId: string;
  channelOrGroup: string;
  isConnected: boolean;
  isTesting: boolean;
  lastConnectedAt?: string;
  pollingActive: boolean;
  useSimulationFallback: boolean;
}

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramMessage {
  id: string;
  from: 'bot' | 'user';
  text: string;
  timestamp: string; // e.g., '18:42'
  dateIso: string;
  isHtml?: boolean;
  photoUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  reply_markup?: {
    inline_keyboard?: TelegramInlineButton[][];
  };
  eventRefId?: string;
}

export interface PushAlertNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  eventType: 'festival' | 'concert';
  city: string;
  venue: string;
  displayDate: string;
  genres: EventGenre[];
  priceFrom: number;
  filterName: string;
  timestamp: string;
  read: boolean;
  telegramDelivered: boolean;
  telegramMessageId?: number;
}

export interface TelegramApiLog {
  id: string;
  timestamp: string;
  method: 'sendMessage' | 'sendPhoto' | 'getMe' | 'getUpdates' | 'answerCallbackQuery';
  status: '200 OK' | '400 Bad Request' | '401 Unauthorized' | 'Simulated';
  payloadSummary: string;
  responsePreview: string;
}

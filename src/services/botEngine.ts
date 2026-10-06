import { ConcertEvent, EventGenre, TelegramMessage } from '../types';
import { MOCK_EVENTS, ALL_GENRES } from '../data/mockEvents';

export interface BotQueryResult {
  replyText: string;
  matchedEvents: ConcertEvent[];
  inlineKeyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
  suggestedFilter?: {
    name: string;
    city: string;
    genres: EventGenre[];
    maxPrice?: number;
  };
}

export function processUserQuery(rawInput: string): BotQueryResult {
  const query = rawInput.trim().toLowerCase();

  // 1. Slash commands
  if (query === '/start' || query === 'start') {
    return {
      replyText: `👋 <b>Welcome to PulseFest Radar Bot!</b> 🎵

I track live concert announcements, festival drops, and ticket releases in real-time.

<b>What can I do for you?</b>
• Tap <b>🔥 Trending</b> to see the hottest festivals
• Ask naturally: <i>"Show me techno in Berlin"</i> or <i>"Indie concerts in London under £80"</i>
• Set customizable radar push alerts to your Telegram chat

Choose a quick action below:`,
      matchedEvents: MOCK_EVENTS.filter((e) => e.isTrending).slice(0, 3),
      inlineKeyboard: [
        [
          { text: '🔥 Trending Worldwide', callback_data: 'cmd_trending' },
          { text: '🎪 All Festivals', callback_data: 'cmd_festivals' },
        ],
        [
          { text: '📍 Concerts Near Me', callback_data: 'cmd_near_me' },
          { text: '🔔 Configure Alert Filters', callback_data: 'cmd_filters' },
        ],
      ],
    };
  }

  if (query === '/help' || query === 'help') {
    return {
      replyText: `ℹ️ <b>PulseFest Bot Commands & Tips</b>

• <code>/trending</code> - Top viral festivals and high-demand tours
• <code>/festivals</code> - Multi-day outdoor music festivals
• <code>/concerts [city]</code> - Local headline gigs
• <code>/alerts</code> - List your active radar notification rules
• <code>/filter [genre]</code> - Filter by genre (Techno, Indie, Hip-Hop...)

💡 <i>Tip: You can also type natural queries like "Rock gigs in London this weekend"!</i>`,
      matchedEvents: [],
      inlineKeyboard: [
        [
          { text: '🔥 Browse Trending', callback_data: 'cmd_trending' },
          { text: '⚙️ Telegram API Settings', callback_data: 'cmd_settings' },
        ],
      ],
    };
  }

  if (query === '/trending' || query.includes('trending') || query === 'hot' || query === 'viral') {
    const trending = MOCK_EVENTS.filter((e) => e.isTrending);
    const summary = trending
      .map(
        (e, i) =>
          `${i + 1}. <b>${e.title}</b> (${e.city})\n   🗓 ${e.displayDate} • From ${e.currency} ${e.priceFrom}\n   🏷 <i>${e.genres.join(', ')}</i>`
      )
      .join('\n\n');

    return {
      replyText: `🔥 <b>TOP TRENDING EVENTS RIGHT NOW:</b>\n\n${summary}\n\nTap below to explore or set push alerts for these events:`,
      matchedEvents: trending,
      inlineKeyboard: [
        [
          { text: '🎪 View Full Lineups', callback_data: 'view_trending_all' },
          { text: '🔔 Alert on Ticket Drops', callback_data: 'set_trending_alert' },
        ],
      ],
    };
  }

  if (query === '/festivals' || query.includes('festival') || query.includes('fest')) {
    const fests = MOCK_EVENTS.filter((e) => e.type === 'festival');
    return {
      replyText: `🎪 <b>Top Festivals on Radar:</b> Found ${fests.length} multi-day festivals.\n\nHere are the top picks with tickets selling fast:`,
      matchedEvents: fests,
      inlineKeyboard: [
        [
          { text: '⚡ View All Festivals', callback_data: 'browse_festivals' },
          { text: '🔔 Create Festival Alert', callback_data: 'new_filter_festivals' },
        ],
      ],
    };
  }

  if (query === '/alerts' || query === 'my alerts' || query.includes('alert')) {
    return {
      replyText: `🔔 <b>Your Radar Alert Settings</b>\n\nPulseFest monitors official ticket outlets & organizers every 5 minutes.\n\nWhen a match occurs, an instant notification is dispatched to your Telegram chat ID!`,
      matchedEvents: [],
      inlineKeyboard: [
        [
          { text: '➕ Create New Alert Filter', callback_data: 'open_new_filter' },
          { text: '🧪 Send Test Push Alert', callback_data: 'trigger_test_alert' },
        ],
      ],
    };
  }

  // 2. Natural language parsing:
  // Detect city
  let matchedCity: string | null = null;
  const cityKeywords = ['london', 'berlin', 'amsterdam', 'new york', 'paris', 'tokyo', 'austin', 'miami', 'chicago', 'denver', 'los angeles'];
  for (const c of cityKeywords) {
    if (query.includes(c)) {
      matchedCity = c;
      break;
    }
  }

  // Detect genres
  const matchedGenres: EventGenre[] = [];
  for (const genre of ALL_GENRES) {
    const clean = genre.toLowerCase();
    if (query.includes(clean) || (clean === 'electronic' && (query.includes('edm') || query.includes('rave')))) {
      matchedGenres.push(genre);
    }
  }

  // Detect budget
  let maxBudget: number | null = null;
  const budgetMatch = query.match(/(?:under|below|max|less than|<|\$|£|€)\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // Filter events based on detected parameters
  let filtered = MOCK_EVENTS.filter((e) => {
    let matches = true;

    if (matchedCity) {
      matches = matches && e.city.toLowerCase().includes(matchedCity);
    }

    if (matchedGenres.length > 0) {
      matches = matches && e.genres.some((g) => matchedGenres.includes(g));
    }

    if (maxBudget !== null) {
      matches = matches && e.priceFrom <= maxBudget;
    }

    // Direct text search in artist names or event title
    if (!matchedCity && matchedGenres.length === 0 && maxBudget === null) {
      const qWords = query.split(/\s+/).filter((w) => w.length > 2);
      const textMatches = qWords.some(
        (w) =>
          e.title.toLowerCase().includes(w) ||
          e.artists.some((a) => a.toLowerCase().includes(w)) ||
          e.venue.toLowerCase().includes(w) ||
          e.city.toLowerCase().includes(w)
      );
      matches = matches && textMatches;
    }

    return matches;
  });

  if (filtered.length > 0) {
    const summaryLines = filtered
      .slice(0, 4)
      .map((e) => `• <b>${e.title}</b> (${e.city}) — ${e.displayDate}\n  🎫 From ${e.currency} ${e.priceFrom} [${e.ticketStatus}]`)
      .join('\n\n');

    const filterDescriptor = [
      matchedGenres.length ? matchedGenres.join('/') : '',
      matchedCity ? `in ${matchedCity.toUpperCase()}` : '',
      maxBudget ? `under ${maxBudget}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      replyText: `🎯 <b>Found ${filtered.length} matched event${filtered.length > 1 ? 's' : ''}</b> ${filterDescriptor ? `for <i>"${filterDescriptor}"</i>` : ''}:\n\n${summaryLines}\n\nWould you like me to set a continuous radar alert for this search?`,
      matchedEvents: filtered,
      inlineKeyboard: [
        [
          { text: `🔔 Alert me for ${matchedCity || 'these'} events`, callback_data: `quick_alert_${matchedCity || 'custom'}` },
          { text: '🎟️ Check Availability', callback_data: `details_${filtered[0].id}` },
        ],
      ],
      suggestedFilter: {
        name: `${matchedGenres.join(', ') || 'Live Events'} in ${matchedCity || 'All Cities'}`,
        city: matchedCity ? matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1) : 'All Cities',
        genres: matchedGenres.length > 0 ? matchedGenres : ['Electronic', 'Indie'],
        maxPrice: maxBudget || undefined,
      },
    };
  }

  // Fallback: If nothing matched specifically, return trending recommendations
  const fallback = MOCK_EVENTS.slice(0, 3);
  return {
    replyText: `🔍 I couldn't find exact matches for <i>"${rawInput}"</i>, but here are the <b>most popular upcoming events</b> worldwide right now:\n\n• <b>Ultra Music Festival</b> (Miami, EDM)\n• <b>Amsterdam Dance Event</b> (Amsterdam, Techno)\n• <b>RÜFÜS DU SOL</b> (New York, Electronic)\n\nTry searching by genre (e.g. <i>"Techno"</i>, <i>"Indie"</i>) or city (e.g. <i>"London"</i>, <i>"Berlin"</i>).`,
    matchedEvents: fallback,
    inlineKeyboard: [
      [
        { text: '⚡ View All Events', callback_data: 'view_all_events' },
        { text: '🎧 Explore by Genre', callback_data: 'explore_genres' },
      ],
    ],
  };
}

export function createWelcomeMessages(): TelegramMessage[] {
  return [
    {
      id: 'msg-welcome-1',
      from: 'bot',
      text: `👋 <b>Welcome to PulseFest Radar Bot!</b> 🎵

I'm linked to the Telegram Bot API framework to deliver instant push alerts for concerts and music festivals right into your chat.

You can ask me for trending shows, or customize alert filters for your favorite genres, cities, and ticket price ceilings.`,
      timestamp: '12:00',
      dateIso: new Date().toISOString(),
      status: 'read',
      isHtml: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔥 Trending Events Now', callback_data: 'cmd_trending' },
            { text: '🎪 Multi-day Festivals', callback_data: 'cmd_festivals' },
          ],
          [
            { text: '🔔 Create Push Alert', callback_data: 'cmd_filters' },
            { text: '⚡ Bot API Status', callback_data: 'cmd_status' },
          ],
        ],
      },
    },
  ];
}

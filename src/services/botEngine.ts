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
      replyText: `👋 <b>Welcome to PulseFest Singapore Radar Bot!</b> 🇸🇬 🎵

I track live concerts, stadium tours, and music festival ticket drops across Singapore in real-time.

<b>What can I do for you?</b>
• Tap <b>🔥 Trending in SG</b> to see high-demand shows
• Ask naturally: <i>"ZoukOut Sentosa tickets"</i> or <i>"Techno at Pasir Panjang under S$100"</i>
• Set customizable radar push alerts directly to your Telegram chat

Choose a quick action below:`,
      matchedEvents: MOCK_EVENTS.filter((e) => e.isTrending).slice(0, 3),
      inlineKeyboard: [
        [
          { text: '🔥 Trending in Singapore', callback_data: 'cmd_trending' },
          { text: '🎪 SG Festivals', callback_data: 'cmd_festivals' },
        ],
        [
          { text: '🏟️ National Stadium Gigs', callback_data: 'cmd_stadium' },
          { text: '🔔 Configure Alert Filters', callback_data: 'cmd_filters' },
        ],
      ],
    };
  }

  if (query === '/help' || query === 'help') {
    return {
      replyText: `ℹ️ <b>PulseFest Singapore Commands & Tips</b>

• <code>/trending</code> - Top viral concerts & festivals in Singapore
• <code>/festivals</code> - Outdoor festivals (ZoukOut, Sundown, F1, Neon Lights)
• <code>/concerts [venue]</code> - Headline gigs (National Stadium, Esplanade, Star Theatre)
• <code>/alerts</code> - Manage your active Singapore radar notification rules
• <code>/filter [genre]</code> - Filter by genre (Techno, Indie, Pop, EDM...)

💡 <i>Tip: You can also ask "Any techno at Pasir Panjang this month?"</i>`,
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
          `${i + 1}. <b>${e.title}</b>\n   📍 ${e.venue} (${e.city})\n   🗓 ${e.displayDate} • From S$ ${e.priceFrom}\n   🏷 <i>${e.genres.join(', ')}</i>`
      )
      .join('\n\n');

    return {
      replyText: `🔥 <b>TOP TRENDING EVENTS IN SINGAPORE RIGHT NOW:</b>\n\n${summary}\n\nTap below to explore or set push alerts for these shows:`,
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
      replyText: `🎪 <b>Top Festivals in Singapore:</b> Found ${fests.length} upcoming music festivals (ZoukOut, Sundown, F1 Padang, Neon Lights).\n\nHere are the top picks with tickets selling fast:`,
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
      replyText: `🔔 <b>Your Singapore Radar Alert Settings</b>\n\nPulseFest monitors official Singapore ticket outlets (SISTIC, Ticketmaster SG, Live Nation) every 5 minutes.\n\nWhen a match occurs, an instant notification is dispatched to your Telegram chat!`,
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
  // Detect Singapore locations and venues
  let matchedCity: string | null = null;
  const sgLocationKeywords = [
    'sentosa',
    'kallang',
    'marina bay',
    'pasir panjang',
    'esplanade',
    'fort canning',
    'siloso',
    'padang',
    'orchard',
    'star theatre',
    'indoor stadium',
    'national stadium',
    'singapore',
  ];

  for (const loc of sgLocationKeywords) {
    if (query.includes(loc)) {
      matchedCity = loc;
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
  const budgetMatch = query.match(/(?:under|below|max|less than|<|\$|s\$|sgd)\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // Filter events based on detected parameters
  let filtered = MOCK_EVENTS.filter((e) => {
    let matches = true;

    if (matchedCity && matchedCity !== 'singapore') {
      const cityOrVenueMatch =
        e.city.toLowerCase().includes(matchedCity) ||
        e.venue.toLowerCase().includes(matchedCity) ||
        e.title.toLowerCase().includes(matchedCity);
      matches = matches && cityOrVenueMatch;
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
      .map((e) => `• <b>${e.title}</b>\n  📍 ${e.venue} — ${e.displayDate}\n  🎫 From S$ ${e.priceFrom} [${e.ticketStatus}]`)
      .join('\n\n');

    const filterDescriptor = [
      matchedGenres.length ? matchedGenres.join('/') : '',
      matchedCity ? `in ${matchedCity.toUpperCase()}` : 'in Singapore',
      maxBudget ? `under S$${maxBudget}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return {
      replyText: `🎯 <b>Found ${filtered.length} matched event${filtered.length > 1 ? 's' : ''} in Singapore</b> ${filterDescriptor ? `for <i>"${filterDescriptor}"</i>` : ''}:\n\n${summaryLines}\n\nWould you like me to set a continuous radar alert for this search?`,
      matchedEvents: filtered,
      inlineKeyboard: [
        [
          { text: `🔔 Alert me for ${matchedCity || 'Singapore'} shows`, callback_data: `quick_alert_${matchedCity || 'singapore'}` },
          { text: '🎟️ Check Availability', callback_data: `details_${filtered[0].id}` },
        ],
      ],
      suggestedFilter: {
        name: `${matchedGenres.join(', ') || 'Live Events'} in Singapore`,
        city: 'All Singapore',
        genres: matchedGenres.length > 0 ? matchedGenres : ['Electronic', 'Pop'],
        maxPrice: maxBudget || undefined,
      },
    };
  }

  // Fallback: If nothing matched specifically, return top Singapore recommendations
  const fallback = MOCK_EVENTS.slice(0, 3);
  return {
    replyText: `🔍 I couldn't find exact matches for <i>"${rawInput}"</i> in Singapore, but here are the <b>most popular upcoming shows</b> on the island:\n\n• <b>ZoukOut Singapore</b> (Siloso Beach, Sentosa)\n• <b>Coldplay: Music of the Spheres</b> (National Stadium)\n• <b>Pasir Panjang Industrial Techno Marathon</b> (Pasir Panjang)\n\nTry searching for venues like <i>"Sentosa"</i>, <i>"National Stadium"</i>, or genres like <i>"Techno"</i>, <i>"Indie"</i>.`,
    matchedEvents: fallback,
    inlineKeyboard: [
      [
        { text: '⚡ View All Singapore Shows', callback_data: 'view_all_events' },
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
      text: `👋 <b>Welcome to PulseFest Singapore Live Radar!</b> 🇸🇬 🎵

I'm linked to the Telegram Bot API framework to deliver instant push alerts for concerts, stadium gigs, and music festivals in Singapore right into your chat.

You can ask me for trending Singapore shows, or customize alert filters for your favorite genres, venues, and ticket price ceilings.`,
      timestamp: '12:00',
      dateIso: new Date().toISOString(),
      status: 'read',
      isHtml: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔥 Trending in Singapore', callback_data: 'cmd_trending' },
            { text: '🎪 SG Festivals (ZoukOut & F1)', callback_data: 'cmd_festivals' },
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

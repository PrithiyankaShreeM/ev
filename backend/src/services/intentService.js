// WattStop Multilingual Intent Recognition Service
// Supports English, Tamil (Tamil script), and Thanglish (Latin-script Tamil)

function detectLanguage(text) {
  if (!text) return 'en-IN';
  // Check for Tamil Unicode range
  const hasTamilScript = /[\u0B80-\u0BFF]/.test(text);
  if (hasTamilScript) return 'ta-IN';

  // Check for Thanglish markers
  const thanglishMarkers = [
    'enakku', 'enga', 'irukku', 'pannu', 'kaatu', 'thedu', 'mani', 'kitta',
    'panna', 'vaanga', 'poga', 'solla', 'theriyuma', 'ennoda', 'ippo', 'nala'
  ];
  const lower = text.toLowerCase();
  const isThanglish = thanglishMarkers.some((word) => lower.includes(word));
  if (isThanglish) return 'ta-IN';

  return 'en-IN';
}

function parseVoiceIntent(rawText) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();
  const language = detectLanguage(text);

  let intent = 'UNKNOWN';
  const parameters = {};

  // Extract connector type
  if (lower.includes('type 2') || lower.includes('type2')) {
    parameters.connectorType = 'Type 2';
  } else if (lower.includes('ccs')) {
    parameters.connectorType = 'CCS';
  } else if (lower.includes('chademo')) {
    parameters.connectorType = 'CHAdeMO';
  } else if (lower.includes('type 1') || lower.includes('type1')) {
    parameters.connectorType = 'Type 1';
  }

  // Extract AC/DC
  if (lower.includes('dc fast') || lower.includes('dc charger') || lower.includes('fast charger')) {
    parameters.acDcType = 'DC';
  } else if (lower.includes('ac charger') || lower.includes('home ac')) {
    parameters.acDcType = 'AC';
  }

  // Extract time parameter (e.g. "5 mani", "5 pm", "17:00", "5 o'clock")
  const timeMatch = lower.match(/(\d{1,2})\s*(?:mani|pm|am|:00|o'clock)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    if ((lower.includes('pm') || lower.includes('evening') || lower.includes('night') || (lower.includes('mani') && hour <= 11 && hour >= 1)) && hour < 12) {
      if (hour <= 6) hour += 12; // Assuming evening for small hours like 5 mani
    }
    parameters.time = `${String(hour).padStart(2, '0')}:00`;
  }

  // Extract locations
  const knownLocations = ['anna nagar', 'adyar', 'velachery', 'omr', 'guindy', 't nagar', 'mylapore', 'tambaram'];
  for (const loc of knownLocations) {
    if (lower.includes(loc)) {
      parameters.location = loc.replace(/\b\w/g, (l) => l.toUpperCase());
      break;
    }
  }

  // Intent classification
  if (
    lower.includes('cancel') ||
    lower.includes('vendam') ||
    lower.includes('cancel pannu')
  ) {
    intent = 'CANCEL_BOOKING';
  } else if (
    lower.includes('my booking') ||
    lower.includes('show booking') ||
    lower.includes('upcoming') ||
    lower.includes('ennoda booking') ||
    (lower.includes('booking') && (lower.includes('kaatu') || lower.includes('list') || lower.includes('history')))
  ) {
    intent = 'SHOW_BOOKINGS';
  } else if (
    lower.includes('free charger') ||
    lower.includes('free-ah') ||
    lower.includes('ilavasam') ||
    (lower.includes('free') && lower.includes('enga'))
  ) {
    intent = 'FIND_FREE';
    parameters.isFree = true;
  } else if (
    lower.includes('cheap') ||
    lower.includes('kammi vila') ||
    lower.includes('lowest price') ||
    lower.includes('kammi price')
  ) {
    intent = 'FIND_CHEAPEST';
  } else if (
    lower.includes('route') ||
    lower.includes('route-la') ||
    lower.includes('along') ||
    lower.includes('vazhila')
  ) {
    intent = 'FIND_ROUTE';
  } else if (
    lower.includes('book') ||
    lower.includes('reserve') ||
    lower.includes('slot podu')
  ) {
    intent = 'BOOK_CHARGER';
  } else if (
    lower.includes('navigate') ||
    lower.includes('directions') ||
    lower.includes('vazhi kaatu')
  ) {
    intent = 'NAVIGATE';
  } else if (
    lower.includes('available') ||
    lower.includes('kaali') ||
    lower.includes('slot irukka')
  ) {
    intent = 'CHECK_AVAILABILITY';
  } else if (
    lower.includes('nearby') ||
    lower.includes('enga irukku') ||
    lower.includes('thedu') ||
    lower.includes('station') ||
    lower.includes('charger') ||
    lower.includes('kitta')
  ) {
    intent = 'FIND_NEARBY';
  }

  return {
    rawText: text,
    language,
    intent,
    parameters
  };
}

module.exports = {
  detectLanguage,
  parseVoiceIntent
};

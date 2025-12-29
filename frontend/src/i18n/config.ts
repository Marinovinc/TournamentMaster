// Supported EU languages
export const locales = [
  'it', // Italiano
  'en', // English
  'de', // Deutsch
  'fr', // Français
  'es', // Español
  'pt', // Português
  'nl', // Nederlands
  'pl', // Polski
  'ro', // Română
  'el', // Ελληνικά (Greek)
  'cs', // Čeština (Czech)
  'hu', // Magyar (Hungarian)
  'sv', // Svenska (Swedish)
  'da', // Dansk (Danish)
  'fi', // Suomi (Finnish)
  'hr', // Hrvatski (Croatian)
  'sl', // Slovenščina (Slovenian)
  'sk', // Slovenčina (Slovak)
  'bg', // Български (Bulgarian)
  'lt', // Lietuvių (Lithuanian)
  'lv', // Latviešu (Latvian)
  'et', // Eesti (Estonian)
  'mt', // Malti (Maltese)
  'ga', // Gaeilge (Irish)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'it';

// Language names in their native form
export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  ro: 'Română',
  el: 'Ελληνικά',
  cs: 'Čeština',
  hu: 'Magyar',
  sv: 'Svenska',
  da: 'Dansk',
  fi: 'Suomi',
  hr: 'Hrvatski',
  sl: 'Slovenščina',
  sk: 'Slovenčina',
  bg: 'Български',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  mt: 'Malti',
  ga: 'Gaeilge',
};

// Language flags (emoji)
export const localeFlags: Record<Locale, string> = {
  it: '🇮🇹',
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  pt: '🇵🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  ro: '🇷🇴',
  el: '🇬🇷',
  cs: '🇨🇿',
  hu: '🇭🇺',
  sv: '🇸🇪',
  da: '🇩🇰',
  fi: '🇫🇮',
  hr: '🇭🇷',
  sl: '🇸🇮',
  sk: '🇸🇰',
  bg: '🇧🇬',
  lt: '🇱🇹',
  lv: '🇱🇻',
  et: '🇪🇪',
  mt: '🇲🇹',
  ga: '🇮🇪',
};

// Priority languages (most common for fishing tournaments)
export const priorityLocales: Locale[] = ['it', 'en', 'de', 'fr', 'es', 'pt'];

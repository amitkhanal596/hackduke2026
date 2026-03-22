export const LOCALE_STORAGE_KEY = "toro_locale";

export const SUPPORTED_LOCALES = [
  "en-US",
  "es",
  "hi",
  "fr",
  "de",
  "ar",
  "pt-BR",
  "ja",
  "zh-CN",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en-US";

const LOCALE_ALIASES: Record<string, AppLocale> = {
  en: "en-US",
  "en-us": "en-US",
  es: "es",
  "es-es": "es",
  "es-us": "es",
  hi: "hi",
  "hi-in": "hi",
  fr: "fr",
  "fr-fr": "fr",
  de: "de",
  "de-de": "de",
  ar: "ar",
  "ar-sa": "ar",
  "ar-eg": "ar",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  ja: "ja",
  "ja-jp": "ja",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-hans": "zh-CN",
};

export function normalizeLocale(input?: string | null): AppLocale {
  if (!input) {
    return DEFAULT_LOCALE;
  }

  const normalized = input.trim().toLowerCase();
  if (normalized in LOCALE_ALIASES) {
    return LOCALE_ALIASES[normalized];
  }

  const languageOnly = normalized.split("-")[0];
  if (languageOnly in LOCALE_ALIASES) {
    return LOCALE_ALIASES[languageOnly];
  }

  return DEFAULT_LOCALE;
}

export function isRtlLocale(locale: string): boolean {
  return normalizeLocale(locale) === "ar";
}

export function getPreferredLocale(): AppLocale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const persisted = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (persisted) {
    return normalizeLocale(persisted);
  }

  return normalizeLocale(navigator.language || DEFAULT_LOCALE);
}

export function setPreferredLocale(locale: string): AppLocale {
  const normalized = normalizeLocale(locale);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    window.dispatchEvent(
      new CustomEvent("toro-locale-changed", { detail: normalized }),
    );
  }

  return normalized;
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "en-US": "English",
  es: "Español",
  hi: "Hindi",
  fr: "Français",
  de: "Deutsch",
  ar: "Arabic",
  "pt-BR": "Português (Brasil)",
  ja: "Japanese",
  "zh-CN": "Chinese (Simplified)",
};

"use client";

import { useEffect, useState } from "react";
import {
  getPreferredLocale,
  normalizeLocale,
  setPreferredLocale,
  type AppLocale,
} from "@/lib/locale";

export function useAppLocale() {
  const [locale, setLocaleState] = useState<AppLocale>(getPreferredLocale());

  useEffect(() => {
    const onLocaleChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setLocaleState(normalizeLocale(customEvent.detail));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "toro_locale") {
        setLocaleState(getPreferredLocale());
      }
    };

    window.addEventListener("toro-locale-changed", onLocaleChanged as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("toro-locale-changed", onLocaleChanged as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setLocale = (nextLocale: string) => {
    const normalized = setPreferredLocale(nextLocale);
    setLocaleState(normalized);
  };

  return { locale, setLocale };
}

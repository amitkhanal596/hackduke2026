"use client";

import { useEffect } from "react";
import {
  DEFAULT_LOCALE,
  getPreferredLocale,
  isRtlLocale,
  normalizeLocale,
} from "@/lib/locale";

export default function LocaleBootstrap() {
  useEffect(() => {
    const applyDocumentLocale = (value?: string) => {
      const locale = normalizeLocale(value || getPreferredLocale());
      document.documentElement.lang = locale;
      document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
    };

    applyDocumentLocale(DEFAULT_LOCALE);

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      applyDocumentLocale(customEvent.detail);
    };

    window.addEventListener("toro-locale-changed", handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener(
        "toro-locale-changed",
        handleLocaleChange as EventListener,
      );
    };
  }, []);

  return null;
}

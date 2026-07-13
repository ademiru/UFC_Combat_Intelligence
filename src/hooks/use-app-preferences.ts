"use client";

import { useCallback, useEffect, useState } from "react";

import {
  APP_PREFERENCES_CHANGED,
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  readAppPreferences,
  writeAppPreferences,
} from "@/lib/preferences";

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(
    DEFAULT_APP_PREFERENCES,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setPreferences(readAppPreferences()), 0);
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<AppPreferences>).detail;
      setPreferences(next ?? readAppPreferences());
    };
    window.addEventListener(APP_PREFERENCES_CHANGED, onChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(APP_PREFERENCES_CHANGED, onChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = preferences.reduceMotion
      ? "true"
      : "false";
  }, [preferences.reduceMotion]);

  const setPreference = useCallback(
    <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => {
      const next = { ...readAppPreferences(), [key]: value };
      writeAppPreferences(next);
    },
    [],
  );

  return { preferences, setPreference };
}

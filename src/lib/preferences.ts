export const APP_PREFERENCES_KEY = "combat-intelligence:preferences";
export const APP_PREFERENCES_CHANGED = "combat-intelligence:preferences-changed";
export const UPDATE_CHECK_REQUESTED = "combat-intelligence:check-update";

export interface AppPreferences {
  automaticDataSync: boolean;
  automaticUpdateChecks: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  automaticDataSync: true,
  automaticUpdateChecks: true,
  reduceMotion: false,
};

export function readAppPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_APP_PREFERENCES;
  try {
    const stored = JSON.parse(
      localStorage.getItem(APP_PREFERENCES_KEY) ?? "{}",
    ) as Partial<AppPreferences>;
    return { ...DEFAULT_APP_PREFERENCES, ...stored };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function writeAppPreferences(preferences: AppPreferences) {
  localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent<AppPreferences>(APP_PREFERENCES_CHANGED, {
      detail: preferences,
    }),
  );
}

"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getDatabase } from "@/lib/database";

export interface Fighter {
  id: number;
  name: string;
  nickname: string | null;
  weight_class: string;
  height: number;
  weight: number;
  reach: number;
  stance: string;
  wins: number;
  losses: number;
  draws: number;
  country: string;
  style: string;
  win_streak: number;
  ko_wins: number;
  submission_wins: number;
  decision_wins: number;
  slpm: number;
  str_acc: number;
  sapm: number;
  str_def: number;
  td_avg: number;
  td_acc: number;
  td_def: number;
  sub_avg: number;
  head_pct: number;
  body_pct: number;
  leg_pct: number;
  is_champion: number;
  champion_title: string | null;
  champion_order: number | null;
  image_url: string | null;
  image_path: string | null;
}

export interface UfcEvent {
  id: number;
  name: string;
  date: string;
  location: string;
  start_time: string;
  status: string;
  source_url: string;
  fight_count: number;
}

export interface Fight {
  id: number;
  event_id: number;
  fighter1_id: number;
  fighter2_id: number;
  fighter1_name: string;
  fighter2_name: string;
  fighter1_image_url: string | null;
  fighter1_image_path: string | null;
  fighter2_image_url: string | null;
  fighter2_image_path: string | null;
  weight_class: string;
  card_type: string;
  bout_order: number;
}

export interface FightHistory {
  id: number;
  fighter_id: number;
  opponent_name: string;
  opponent_url: string | null;
  opponent_image_url: string | null;
  opponent_image_path: string | null;
  result: "W" | "L" | "D" | "NC";
  fight_date: string;
  event_name: string;
  event_url: string | null;
  method: string;
  round: number;
  fight_time: string;
}

export interface SyncProgress {
  stage: string;
  message: string;
  current: number;
  total: number;
}

export interface SyncReport {
  fighterProfilesUpdated: number;
  fightHistoryUpdated: number;
  championsUpdated: number;
  eventsUpdated: number;
  fightsUpdated: number;
  syncedAt: string;
  source: string;
  warnings: string[];
}

interface DataState {
  fighters: Fighter[];
  events: UfcEvent[];
  fights: Fight[];
  fightHistory: FightHistory[];
  metadata: Record<string, string>;
  loading: boolean;
  error: string | null;
  onlineMode: boolean;
  syncing: boolean;
  syncProgress: SyncProgress | null;
  syncError: string | null;
  syncReport: SyncReport | null;
  refresh: () => Promise<void>;
  setOnlineMode: (enabled: boolean) => Promise<void>;
  syncNow: () => Promise<void>;
}

const UfcDataContext = createContext<DataState | null>(null);

const fighterQuery = `
  SELECT
    f.id, f.name, f.nickname, f.weight_class,
    COALESCE(f.height, 0) AS height,
    COALESCE(f.weight, 0) AS weight,
    COALESCE(f.reach, 0) AS reach,
    f.stance, f.wins, f.losses, f.draws, f.country, f.style, f.win_streak,
    f.ko_wins, f.submission_wins, f.decision_wins,
    fs.slpm, fs.str_acc, fs.sapm, fs.str_def, fs.td_avg, fs.td_acc,
    fs.td_def, fs.sub_avg, fs.head_pct, fs.body_pct, fs.leg_pct,
    CASE WHEN c.fighter_id IS NULL THEN 0 ELSE 1 END AS is_champion,
    c.weight_class AS champion_title,
    c.display_order AS champion_order,
    f.image_url, f.image_path
  FROM fighters f
  JOIN fighter_stats fs ON fs.fighter_id = f.id
  LEFT JOIN champions c ON c.fighter_id = f.id
  WHERE f.is_active = 1
  ORDER BY f.name COLLATE NOCASE
`;

const eventQuery = `
  SELECT e.id, e.name, e.date, e.location, e.start_time, e.status,
         e.source_url, COUNT(f.id) AS fight_count
  FROM events e
  LEFT JOIN fights f ON f.event_id = e.id
  WHERE e.status = 'upcoming'
  GROUP BY e.id
  ORDER BY e.date ASC
`;

const fightQuery = `
  SELECT f.id, f.event_id, f.fighter1_id, f.fighter2_id,
         a.name AS fighter1_name, b.name AS fighter2_name,
         a.image_url AS fighter1_image_url, a.image_path AS fighter1_image_path,
         b.image_url AS fighter2_image_url, b.image_path AS fighter2_image_path,
         f.weight_class, f.card_type, f.bout_order
  FROM fights f
  JOIN fighters a ON a.id = f.fighter1_id
  JOIN fighters b ON b.id = f.fighter2_id
  ORDER BY f.event_id, f.card_type, f.bout_order
`;

const fightHistoryQuery = `
  SELECT h.id, h.fighter_id, h.opponent_name, h.opponent_url, h.result,
         h.fight_date, h.event_name, h.event_url, h.method, h.round, h.fight_time,
         opponent.image_url AS opponent_image_url,
         opponent.image_path AS opponent_image_path
  FROM fighter_fight_history h
  LEFT JOIN fighters opponent ON opponent.source_url = h.opponent_url
  ORDER BY h.fighter_id, h.fight_date DESC
`;

export function DataProvider({ children }: { children: ReactNode }) {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [events, setEvents] = useState<UfcEvent[]>([]);
  const [fights, setFights] = useState<Fight[]>([]);
  const [fightHistory, setFightHistory] = useState<FightHistory[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineMode, setOnlineModeState] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const autoSyncChecked = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const database = await getDatabase();
      const [fighterRows, eventRows, fightRows, historyRows, metadataRows] =
        await Promise.all([
          database.select<Fighter[]>(fighterQuery),
          database.select<UfcEvent[]>(eventQuery),
          database.select<Fight[]>(fightQuery),
          database.select<FightHistory[]>(fightHistoryQuery),
          database.select<Array<{ key: string; value: string }>>(
            "SELECT key, value FROM app_metadata",
          ),
        ]);

      setFighters(fighterRows);
      setEvents(eventRows);
      setFights(fightRows);
      setFightHistory(historyRows);
      const nextMetadata = Object.fromEntries(
        metadataRows.map((row) => [row.key, row.value]),
      );
      setMetadata(nextMetadata);
      setOnlineModeState(nextMetadata.online_mode_enabled === "1");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Yerel veri okunamadı.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncReport(null);
    setSyncProgress({
      stage: "connecting",
      message: "Resmî UFC kaynağına bağlanılıyor",
      current: 0,
      total: 1,
    });

    try {
      const report = await invoke<SyncReport>("sync_online_data");
      setSyncReport(report);
      await refresh();
    } catch (cause) {
      const message =
        typeof cause === "string"
          ? cause
          : cause instanceof Error
            ? cause.message
            : "Online güncelleme tamamlanamadı.";
      setSyncError(message);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  }, [refresh]);

  const setOnlineMode = useCallback(
    async (enabled: boolean) => {
      setOnlineModeState(enabled);
      setSyncError(null);
      autoSyncChecked.current = true;
      const database = await getDatabase();
      await database.execute(
        `
          INSERT INTO app_metadata(key, value, updated_at)
          VALUES ('online_mode_enabled', $1, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        `,
        [enabled ? "1" : "0"],
      );

      if (enabled) {
        await syncNow();
      } else {
        setMetadata((current) => ({
          ...current,
          online_mode_enabled: "0",
          dataset_mode: "offline cache",
        }));
      }
    },
    [syncNow],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;
    void listen<SyncProgress>("ufc-sync-progress", (event) => {
      setSyncProgress(event.payload);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => unlisten?.();
  }, []);

  useEffect(() => {
    if (
      loading ||
      !onlineMode ||
      syncing ||
      autoSyncChecked.current
    ) {
      return;
    }

    autoSyncChecked.current = true;
    const lastSync = metadata.last_online_sync
      ? Date.parse(metadata.last_online_sync)
      : 0;
    const isStale = !lastSync || Date.now() - lastSync > 6 * 60 * 60 * 1000;
    if (!isStale) {
      return;
    }

    const timer = window.setTimeout(() => {
      void syncNow();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loading, metadata.last_online_sync, onlineMode, syncing, syncNow]);

  const value = useMemo(
    () => ({
      fighters,
      events,
      fights,
      fightHistory,
      metadata,
      loading,
      error,
      onlineMode,
      syncing,
      syncProgress,
      syncError,
      syncReport,
      refresh,
      setOnlineMode,
      syncNow,
    }),
    [
      fighters,
      events,
      fights,
      fightHistory,
      metadata,
      loading,
      error,
      onlineMode,
      syncing,
      syncProgress,
      syncError,
      syncReport,
      refresh,
      setOnlineMode,
      syncNow,
    ],
  );

  return (
    <UfcDataContext.Provider value={value}>{children}</UfcDataContext.Provider>
  );
}

export function useUfcData() {
  const context = useContext(UfcDataContext);
  if (!context) {
    throw new Error("useUfcData must be used inside DataProvider");
  }
  return context;
}

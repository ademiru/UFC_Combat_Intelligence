import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:ufc_data.db";

let databasePromise: Promise<Database> | null = null;

/**
 * Returns the single application database connection.
 * Call this only from client-side code running inside the Tauri webview.
 */
export function getDatabase(): Promise<Database> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("SQLite is only available inside the Tauri webview."),
    );
  }

  databasePromise ??= Database.load(DATABASE_URL);
  return databasePromise;
}


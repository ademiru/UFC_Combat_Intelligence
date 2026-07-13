import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:ufc_data.db";
const OPEN_RETRY_DELAYS = [0, 180, 520, 1_200] as const;

let databasePromise: Promise<Database> | null = null;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "Bilinmeyen SQLite bağlantı hatası.";
}

async function openDatabase() {
  let lastError: unknown;

  for (const delay of OPEN_RETRY_DELAYS) {
    if (delay > 0) await wait(delay);
    try {
      return await Database.load(DATABASE_URL);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Yerel SQLite açılamadı: ${errorMessage(lastError)}`);
}

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

  if (!databasePromise) {
    const opening = openDatabase();
    databasePromise = opening;
    void opening.catch(() => {
      // Reddedilmiş Promise'i kalıcı önbellekte tutma; sonraki deneme temiz açılır.
      if (databasePromise === opening) databasePromise = null;
    });
  }

  return databasePromise;
}

/** Clears only the JS connection handle; the SQLite file and user data stay untouched. */
export function resetDatabaseConnection() {
  databasePromise = null;
}


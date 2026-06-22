import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const version = process.argv[2]?.trim().replace(/^v/, "");

if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error("Kullanım: node scripts/set-version.mjs 1.2.3");
}

const root = resolve(import.meta.dirname, "..");
const packagePath = resolve(root, "package.json");
const tauriPath = resolve(root, "src-tauri", "tauri.conf.json");
const cargoPath = resolve(root, "src-tauri", "Cargo.toml");

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.version = version;
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

const tauriConfig = JSON.parse(await readFile(tauriPath, "utf8"));
tauriConfig.version = version;
await writeFile(tauriPath, `${JSON.stringify(tauriConfig, null, 2)}\n`, "utf8");

const cargoToml = await readFile(cargoPath, "utf8");
const cargoVersionPattern = /(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+("\s*)/;

if (!cargoVersionPattern.test(cargoToml)) {
  throw new Error("Cargo.toml içindeki paket sürümü bulunamadı.");
}

const nextCargoToml = cargoToml.replace(cargoVersionPattern, `$1${version}$2`);
await writeFile(cargoPath, nextCargoToml, "utf8");
console.log(`UFC Panel sürümü ${version} olarak ayarlandı.`);

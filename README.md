# UFC Panel

UFC Panel; Tauri v2, Next.js ve SQLite üzerine kurulu, tamamen yerel çalışan bir UFC/MMA analiz masaüstü uygulamasıdır. İlk faz; statik frontend, masaüstü kabuğu, güvenli SQL izinleri, sürümlü veritabanı migration'ı ve dört ana modülün navigasyon iskeletini içerir.

## 1. Kurulum komutları

### Windows önkoşulları

Tauri'nin Windows üzerinde Rust, Microsoft C++ Build Tools ve WebView2'ye ihtiyacı vardır. Node.js 20.9+ kullanın.

```powershell
winget install OpenJS.NodeJS.LTS
winget install Rustlang.Rustup
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Windows 10 (1803+) ve Windows 11'de WebView2 çoğunlukla hazır gelir. Eksikse Microsoft WebView2 Runtime kurulmalıdır. Yeni terminal açtıktan sonra:

```powershell
node --version
rustc --version
cargo --version
corepack enable
```

### Sıfırdan Next.js + Tauri v2 oluşturma

Aşağıdaki komutlar aynı mimariyi boş bir klasörde kurar:

```powershell
corepack pnpm create next-app@latest ufc-panel --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
cd ufc-panel

pnpm add -D @tauri-apps/cli@latest
pnpm add @tauri-apps/api@latest
pnpm tauri init
```

`pnpm tauri init` soruları için:

```text
App name: UFC Panel
Window title: UFC Panel · Combat Intelligence
Web assets location: ../out
Dev server URL: http://localhost:3000
Frontend dev command: pnpm dev
Frontend build command: pnpm build
```

Next.js statik export ayarı [next.config.ts](./next.config.ts) içinde yapılır:

```ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
```

Tauri, üretim derlemesinde oluşan `out/` klasörünü `frontendDist: "../out"` ile paketler.

### Bu repoyu çalıştırma

```powershell
corepack pnpm install
corepack pnpm tauri dev
```

Yalnızca web arayüzünü geliştirmek için:

```powershell
corepack pnpm dev
```

Üretim kontrolleri:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm tauri build
```

## 2. `tauri-plugin-sql` ve SQLite

Plugin'i yeni bir projeye eklemek için:

```powershell
pnpm add @tauri-apps/plugin-sql@latest
cd src-tauri
cargo add tauri-plugin-sql --features sqlite
cd ..
```

Tauri'nin önerdiği kısa yol da kullanılabilir:

```powershell
pnpm tauri add sql
```

SQLite özelliğinin `src-tauri/Cargo.toml` içinde açık olduğunu kontrol edin:

```toml
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
```

Bu projede:

- Plugin ve migration kaydı [src-tauri/src/lib.rs](./src-tauri/src/lib.rs) içindedir.
- İlk şema [src-tauri/migrations/0001_initial.sql](./src-tauri/migrations/0001_initial.sql) dosyasındadır.
- Webview SQL erişimi [src-tauri/capabilities/default.json](./src-tauri/capabilities/default.json) içindeki `sql:default` izniyle sınırlandırılır.
- Frontend bağlantısı [src/lib/database.ts](./src/lib/database.ts) üzerinden tekil ve gecikmeli (`lazy`) açılır.
- `ufc_data.db`, işletim sisteminin uygulama veri dizininde Tauri tarafından oluşturulur; proje klasörüne yazılmaz.

Migration sürümünü değiştirmeden yayınlanmış SQL dosyasını düzenlemeyin. Sonraki şema değişiklikleri `0002_...sql` gibi yeni bir dosya ve daha yüksek migration sürümü olarak eklenmelidir.

## 3. Klasör mimarisi

```text
ufc-panel/
├─ src/
│  ├─ app/                       # Next.js App Router sayfaları
│  │  ├─ analytics/              # Oktagon Derin Analizi
│  │  ├─ fighters/               # Fighter Explorer
│  │  ├─ h2h/                    # H2H Laboratuvarı
│  │  ├─ globals.css             # Dark theme ve tasarım tokenları
│  │  ├─ layout.tsx              # Uygulama kök layout'u
│  │  └─ page.tsx                # Dashboard / Fight Center
│  ├─ assets/                    # Kaynak logo ve görseller
│  ├─ components/
│  │  ├─ brand/                  # Marka bileşenleri
│  │  ├─ layout/                 # AppShell ve Sidebar
│  │  ├─ shared/                 # Modüller arası ortak bileşenler
│  │  └─ ui/                     # shadcn/ui bileşenleri
│  ├─ hooks/                     # Paylaşılan React hook'ları (sonraki faz)
│  ├─ lib/                       # Database, yardımcılar ve domain servisleri
│  └─ types/                     # Domain tipleri (sonraki faz)
├─ src-tauri/
│  ├─ capabilities/              # Tauri v2 izinleri
│  ├─ icons/                     # Masaüstü ve mobil uygulama ikonları
│  ├─ migrations/                # Sürümlü SQLite migration dosyaları
│  ├─ src/                       # Rust uygulama girişi
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ components.json               # shadcn/ui yapılandırması
├─ next.config.ts                # Statik export ayarı
└─ package.json
```

Önerilen büyüme kuralı: sayfalar veri sorgulamaz; `lib/repositories` veri erişimini, `lib/services` analiz kurallarını, `components/features/<module>` ise modüle özgü arayüzü taşır. Rust tarafına yalnızca yoğun hesaplama, dosya sistemi veya işletim sistemi yetkisi gerektiren işler alınır.

## İlk fazda hazır olanlar

- Sabit, koyu temalı masaüstü sidebar
- Dashboard, Fighter Explorer, H2H ve Oktagon Analizi rotaları
- UFC kırmızısı tasarım tokenları ve başlangıç shadcn/ui Button bileşeni
- Next.js statik export
- Tauri v2 capability/CSP yapılandırması
- SQLite tabloları, foreign key'ler, kontroller ve sorgu indeksleri
- Tauri uygulama ikon seti

## Dahili çevrimdışı veri seti

Uygulama ilk açılışta `0002_seed_starter_dataset.sql` migration'ını otomatik çalıştırır. İnternet bağlantısı gerektirmeden aşağıdaki veriler hazır gelir:

- 39 aktif UFC dövüşçüsü ve detaylı performans metrikleri
- 11 güncel sıklet şampiyonu
- 3 yaklaşan etkinlik ve 10 Main Card eşleşmesi
- Fiziksel ölçüler, rekor, SLpM/SApM, vuruş ve takedown yüzdeleri
- Bitiriş yöntemleri ile kafa/gövde/bacak vuruş dağılımları

Veri anlık görüntü tarihi `20 Haziran 2026` olarak arayüzde gösterilir. Kaynak veriler UFC.com sıralama, etkinlik ve sporcu sayfalarından doğrulanmıştır. Sonraki veri güncellemeleri mevcut migration dosyasını değiştirmek yerine yeni bir migration sürümüyle eklenmelidir.

## Online mod ve güncel veriler

Üst çubuktaki **Online Mod** anahtarı açıldığında Rust senkronizasyon servisi doğrudan resmî UFC.com sıralama, etkinlik ve sporcu sayfalarını okur. Güncel şampiyonlar, yaklaşan kartlar, eşleşmeler ve sporcu metrikleri tek bir SQLite transaction'ı içinde `ufc_data.db` önbelleğine yazılır.

- Son başarılı güncellemenin üzerinden 6 saat geçtiyse uygulama açılışta otomatik senkronize olur.
- Yenile düğmesiyle istenildiği zaman manuel güncelleme yapılabilir.
- Ağ veya kaynak hatasında transaction geri alınır; çalışan son yerel veri korunur.
- Resmî sporcu fotoğrafları uygulama veri dizinine indirilir ve çevrimdışı kullanılır.
- Takip edilen sporcuların son beş resmî maçı; sonuç, rakip, etkinlik, yöntem, raunt ve süreyle yerel veritabanına kaydedilir.
- Eksik resmî ölçüler arayüzde `—` olarak gösterilir ve mevcut doğrulanmış değerlerin üzerine sıfır yazılmaz.
- Arayüzde kaynak, son senkron zamanı, aşama ilerlemesi ve çevrimdışı önbellek durumu açıkça gösterilir.

Canlı senkronizasyon kapsamı; resmî sıralamalar, yaklaşan etkinlikler, uygulamanın takip ettiği sporcu profilleri ve bu sporcuların son beş maçıdır. H2H skorları ile kardiyo projeksiyonları resmî UFC tahmini değil, yerel istatistiklerden üretilen analiz çıktılarıdır. Uygulama henüz UFC'nin tüm tarihsel maç arşivini veya bütün aktif kadrosunu eksiksiz kapsadığını iddia etmez.

Online ayrıştırma ve SQLite yazma akışı `src-tauri/src/sync.rs`, mod yönetimi ise `src/components/providers/data-provider.tsx` içindedir.

Resmî kaynaklar: [Tauri + Next.js](https://v2.tauri.app/start/frontend/nextjs/), [Tauri SQL Plugin](https://v2.tauri.app/plugin/sql/), [Next.js Static Exports](https://nextjs.org/docs/app/guides/static-exports).

<div align="center">

```text
 ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ████████╗
██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝
██║     ██║   ██║██╔████╔██║██████╔╝███████║   ██║
██║     ██║   ██║██║╚██╔╝██║██╔══██╗██╔══██║   ██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║   ██║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝

██╗███╗   ██╗████████╗███████╗██╗     ██╗     ██╗ ██████╗ ███████╗███╗   ██╗ ██████╗███████╗
██║████╗  ██║╚══██╔══╝██╔════╝██║     ██║     ██║██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝
██║██╔██╗ ██║   ██║   █████╗  ██║     ██║     ██║██║  ███╗█████╗  ██╔██╗ ██║██║     █████╗
██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██║     ██║██║   ██║██╔══╝  ██║╚██╗██║██║     ██╔══╝
██║██║ ╚████║   ██║   ███████╗███████╗███████╗██║╚██████╔╝███████╗██║ ╚████║╚██████╗███████╗
╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
```

### Oktagonun içini değil, arkasındaki veriyi gör.

Maç kartları, dövüşçü profilleri, canlı sonuçlar ve stil analizleri için hazırlanmış ücretsiz UFC masaüstü merkezi.

[![Son Sürüm](https://img.shields.io/github/v/release/ademiru/UFC_Combat_Intelligence?style=for-the-badge&color=dc2626&label=SON%20SÜRÜM)](https://github.com/ademiru/UFC_Combat_Intelligence/releases/latest)
[![Windows](https://img.shields.io/badge/WINDOWS-10%20%2F%2011-111827?style=for-the-badge&logo=windows)](https://github.com/ademiru/UFC_Combat_Intelligence/releases/latest)
[![Topluluk](https://img.shields.io/badge/%C3%9CCRETS%C4%B0Z-TOPLULUK%20PROJES%C4%B0-059669?style=for-the-badge)](https://github.com/ademiru/UFC_Combat_Intelligence)

### [⬇ Windows için son sürümü indir](https://github.com/ademiru/UFC_Combat_Intelligence/releases/latest)

</div>

---

| ⚡ HIZLI | 📴 ÇEVRİMDIŞI | 🔄 GÜNCEL | 🎬 VİDEOLU |
|:---:|:---:|:---:|:---:|
| Hafif masaüstü yapısı | Son çalışan veri hep yanında | Resmî UFC verisiyle senkronizasyon | Dövüşçüye özel resmî içerikler |

## MAÇ GECESİ BAŞLADIĞINDA

Sekmeler arasında kaybolma. Combat Intelligence sana tek ekranda şunları söyler:

- Sıradaki UFC etkinliği ne zaman?
- Türkiye saatine göre ana kart kaçta başlıyor?
- Son etkinlikte kim, nasıl ve kaçıncı rauntta kazandı?
- Main Card, Prelims ve Early Prelims eşleşmeleri neler?
- İki dövüşçü arasında boy, reach, tempo ve stil avantajı kimde?
- Dövüşçünün son maçları ve performans eğrisi nasıl?

```text
┌─ NEXT OPERATION ───────────────────────────────────────────────┐
│  UFC FIGHT NIGHT                         TÜRKİYE SAATİ  03:00  │
│                                                                │
│  RED CORNER              VS              BLUE CORNER           │
│  PRESSURE WRESTLER                       COUNTER STRIKER        │
│                                                                │
│  REACH  +5 CM       TD DEF  %82       LAST 5  W W L W W       │
└────────────────────────────────────────────────────────────────┘
```

## KOMUTA MERKEZİ

### Fight Center

Yaklaşan kartı, geri sayımı ve Türkiye saatini gösterir. Tamamlanan etkinliklerde kazanan, kaybeden, bitiriş yöntemi, raunt ve süre anında görünür.

### Roster / DB

UFC kadrosunda isim, takma ad, sıklet, stil ve performans değerleriyle arama yap. Dövüşçü kartından doğrudan ayrıntılı profile geç.

### Fighter Intel

Bir dövüşçüyü sadece rekorundan ibaret görme:

- Fiziksel profil ve reach
- Vuruş hacmi ve isabet oranı
- Takedown hücumu ve savunması
- KO, submission ve karar dağılımı
- Son maçlar ve kariyer özeti
- Cephanelik radar grafiği
- Resmî UFC tanıtım, röportaj ve öne çıkan videoları

Videolar uygulamayı şişirmez. Yalnızca katalog bilgisi yerelde tutulur; yayınlar resmî UFC kaynağından uygulamanın kendi oynatıcısında izlenir.

### Tactical Matchup

İki dövüşçüyü yan yana getir. Boy, reach, striking, grappling, savunma, tempo ve bitiricilik farklarını tek bakışta karşılaştır.

### Analytics Lab

Sıkletler, bitiriş biçimleri, liderler ve organizasyon genelindeki eğilimler için hazırlanmış istatistik laboratuvarı.

## HAFİF SIKLET, AĞIR PERFORMANS

Combat Intelligence, Electron yerine **Tauri** kullanır. Farkı basit:

```text
  KLASİK ELECTRON UYGULAMASI              COMBAT INTELLIGENCE
 ┌──────────────────────────┐            ┌──────────────────────────┐
 │ Uygulama                  │            │ Uygulama arayüzü          │
 │ Node.js                   │            │ Rust çekirdeği            │
 │ Kendi Chromium paketi     │            │ Windows WebView2          │
 └──────────────────────────┘            └──────────────────────────┘
   Her uygulamayla tekrar paketlenir        Sistemdeki altyapıyı kullanır
```

Electron uygulamaları çoğunlukla kendi Chromium ve Node.js çalışma ortamını beraberinde taşır. Tauri ise Windows’un mevcut WebView2 altyapısını kullanır ve sistem işlemlerini Rust çekirdeğinde yürütür. Sonuç genellikle daha küçük kurulum paketi, daha hızlı açılış ve daha düşük temel kaynak kullanımıdır.

> Güncel Windows kurulum paketi yalnızca yaklaşık **6,4 MB**. Gerçek RAM ve işlemci kullanımı açık ekrana ve yapılan işleme göre değişir.

Teknik tarafın tamamı bu kadar: **Tauri + Rust + yerel SQLite**. Senin görmen gereken ise hızlı açılan, internet kesilince çökmeyen bir maç merkezi.

## ÇEVRİMİÇİ + YEREL

```text
          RESMÎ UFC VERİSİ
                 │
                 ▼
        ┌─────────────────┐
        │ ONLINE SYNC     │
        └────────┬────────┘
                 │ doğrula + kaydet
                 ▼
        ┌─────────────────┐
        │ YEREL ÖNBELLEK  │
        └────────┬────────┘
                 │
                 ▼
         UYGULAMA HER ZAMAN HAZIR
```

Online Mod açıldığında güncel UFC verileri alınır ve güvenli biçimde yerel veritabanına kaydedilir. Bağlantı kesilirse son çalışan veriler kullanılmaya devam eder. Başarısız bir güncelleme mevcut verilerini bozmaz.

## GÜNCELLEMELER

Yeni sürüm yayımlandığında uygulama bunu otomatik algılar.

- Yeni güncelleme paneli açılır.
- Sürüm notlarını okuyabilirsin.
- **Şimdi güncelle** diyerek indirip kurabilirsin.
- **Sonra** diyerek paneli kapatabilirsin.
- Paket imzası kurulumdan önce doğrulanır.
- İşlem tamamlandığında uygulama yeniden açılır.

Hiçbir güncelleme zorla kurulmaz; karar her zaman sende.

## KURULUM

1. [Releases](https://github.com/ademiru/UFC_Combat_Intelligence/releases/latest) sayfasını aç.
2. `Combat.Intelligence_*_x64-setup.exe` dosyasını indir.
3. Kurulumu tamamla ve uygulamayı aç.
4. Güncel kartlar için üst panelden **Online Mod** seçeneğini etkinleştir.

> Windows ilk kurulumda SmartScreen uyarısı gösterebilir. Dosyayı yalnızca bu deponun resmî Releases sayfasından indirdiğinden emin ol.

## NEDEN COMBAT INTELLIGENCE?

Çünkü bir maç yalnızca `W` veya `L` değildir.

Bir dövüşçünün baskı altında nasıl davrandığı, mesafeyi nasıl kullandığı, güreşe karşı ne kadar dirençli olduğu ve ilerleyen rauntlarda temposunu koruyup koruyamadığı sonucu belirler. Combat Intelligence bu parçaları okunabilir, hızlı ve maç gecesinde gerçekten işe yarayan bir ekranda birleştirir.

```text
      ┌─────────────── TALE OF THE TAPE ───────────────┐
      │                                                │
      │   STRIKING   ████████░░   82                  │
      │   GRAPPLING  █████████░   91                  │
      │   DEFENCE    ███████░░░   74                  │
      │   CARDIO     ████████░░   86                  │
      │                                                │
      │        DATA DOESN'T FIGHT. FIGHTERS DO.       │
      └────────────────────────────────────────────────┘
```

## TOPLULUK

Bir veri hatası, eksik dövüşçü veya geliştirme fikri mi buldun?

- [Hata bildir](https://github.com/ademiru/UFC_Combat_Intelligence/issues/new)
- [Tüm talepleri görüntüle](https://github.com/ademiru/UFC_Combat_Intelligence/issues)
- Projeyi beğendiysen yıldız bırak ⭐

## YASAL NOT

Combat Intelligence bağımsız ve hayran yapımı bir projedir. UFC, Ultimate Fighting Championship veya bağlı kuruluşları tarafından geliştirilmemiş, desteklenmemiş ya da onaylanmamıştır. UFC adı, etkinlik bilgileri ve ilgili marka varlıkları kendi hak sahiplerine aittir. İstatistiksel analizler bilgilendirme ve eğlence amaçlıdır; bahis tavsiyesi değildir.

---

<div align="center">

```text
[ COMBAT INTELLIGENCE // LOCAL-FIRST FIGHT ANALYSIS SYSTEM ]
```

**FIGHT NIGHT. FULL CONTEXT.**

</div>

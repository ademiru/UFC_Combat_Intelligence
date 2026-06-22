# UFC Panel Windows yayın ve uzaktan güncelleme

Bu proje ilk dağıtım için NSIS `Setup.exe`, sonraki sürümler için Tauri'nin imzalı updater paketlerini kullanır. Uygulama yalnızca özel anahtarla imzalanmış güncellemeleri kabul eder.

## Bir kez yapılacak kurulum

1. GitHub'da bir depo oluşturun ve projeyi bu depoya gönderin.
2. GitHub CLI ile giriş yapın: `gh auth login`.
3. Proje kökünde aşağıdaki komutu çalıştırın:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\configure-github-secrets.ps1 -Repository KULLANICI/DEPO
   ```

Özel anahtar `C:\Users\<kullanıcı>\.tauri\ufc-panel.key` altında kalır. GitHub'a yalnızca şifreli Actions secret olarak gönderilir. Bu dosyayı kaybederseniz mevcut kurulumlara yeni güncelleme veremezsiniz; parola dosyasıyla birlikte çevrimdışı ve güvenli bir yedeğini alın.

## İlk EXE ve sonraki sürümler

GitHub deposunda **Actions → Signed Windows release → Run workflow** yolunu açın. Sürümü (`0.1.0`, sonra `0.2.0` gibi) ve kısa sürüm notunu yazın. İşlem tamamlandığında GitHub Releases altında bir taslak yayın oluşur.

Taslakta şu dosyaları kontrol edin:

- Kullanıcıya göndereceğiniz NSIS `Setup.exe`
- İmzalı updater paketi ve `.sig` dosyası
- Uygulamanın denetlediği `latest.json`

Taslağı yayımladığınız anda bu sürüm güncelleme kanalında görünür. Önce kendi bilgisayarınızda kurulum testi yapın; sonra **Publish release** düğmesini kullanın.

## Yerel kurulum üretimi

GitHub Actions dışında aynı endpoint ve anahtarla yerel `Setup.exe` üretmek için:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-installer.ps1 -Repository KULLANICI/DEPO
```

Çıktı `src-tauri\target\release\bundle\nsis` klasörüne yazılır. Yerel üretim yayın sunucusuna dosya yüklemez; uzaktan güncelleme için önerilen yayın yolu GitHub Actions'tır.

## Güvenli sürümleme kuralları

- Her yayın sürümü önceki sürümden yüksek olmalıdır (`0.1.0` → `0.2.0`).
- Özel anahtarı, DPAPI parola dosyasını veya açık parolayı depoya eklemeyin.
- Yayın taslağını gerçek bir Windows kurulumunda doğrulamadan yayımlamayın.
- `latest.json`, paket ve `.sig` aynı GitHub Release içinde tutulmalıdır.
- Güncelleme anahtarını değiştirirseniz eski kurulumlar yeni paketleri reddeder.

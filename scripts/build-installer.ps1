param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')]
    [string]$Repository
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$keyDirectory = Join-Path $env:USERPROFILE '.tauri'
$privateKeyPath = Join-Path $keyDirectory 'ufc-panel.key'
$passwordPath = Join-Path $keyDirectory 'ufc-panel.key.password.dpapi'
$releaseConfigPath = Join-Path $root 'src-tauri\tauri.release.conf.json'

if (!(Test-Path -LiteralPath $privateKeyPath) -or !(Test-Path -LiteralPath $passwordPath)) {
    throw 'Güncelleme imzalama anahtarı bulunamadı. C:\Users\<kullanıcı>\.tauri klasörünü kontrol edin.'
}

$securePassword = Get-Content -Raw -LiteralPath $passwordPath | ConvertTo-SecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $signingPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $releaseConfig = @{
        plugins = @{
            updater = @{
                endpoints = @("https://github.com/$Repository/releases/latest/download/latest.json")
            }
        }
    } | ConvertTo-Json -Depth 5

    [IO.File]::WriteAllText($releaseConfigPath, $releaseConfig, [Text.UTF8Encoding]::new($false))
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw -LiteralPath $privateKeyPath
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $signingPassword

    Push-Location $root
    try {
        corepack pnpm tauri build --bundles nsis --config src-tauri/tauri.release.conf.json
        if ($LASTEXITCODE -ne 0) { throw "Tauri paketleme işlemi $LASTEXITCODE koduyla durdu." }
    }
    finally {
        Pop-Location
    }
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $releaseConfigPath -Force -ErrorAction SilentlyContinue
}

$bundleDirectory = Join-Path $root 'src-tauri\target\release\bundle\nsis'
Write-Host "Kurulum paketi hazır: $bundleDirectory"

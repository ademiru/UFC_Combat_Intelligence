param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')]
    [string]$Repository
)

$ErrorActionPreference = 'Stop'
$keyDirectory = Join-Path $env:USERPROFILE '.tauri'
$privateKeyPath = Join-Path $keyDirectory 'ufc-panel.key'
$passwordPath = Join-Path $keyDirectory 'ufc-panel.key.password.dpapi'

if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI (gh) bulunamadı. Önce https://cli.github.com/ adresinden kurun.'
}

gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Önce gh auth login ile GitHub hesabınıza giriş yapın.' }

$securePassword = Get-Content -Raw -LiteralPath $passwordPath | ConvertTo-SecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $signingPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    Get-Content -Raw -LiteralPath $privateKeyPath | gh secret set TAURI_SIGNING_PRIVATE_KEY --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'Özel anahtar GitHub secret olarak kaydedilemedi.' }

    $signingPassword | gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'Anahtar parolası GitHub secret olarak kaydedilemedi.' }
}
finally {
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

Write-Host "GitHub Actions imzalama secret'ları $Repository deposuna kaydedildi."

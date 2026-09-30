# register-bw.ps1 で登録した .bw の関連付けを取り消す（Windows 用）
# 使い方：PowerShell で  powershell -ExecutionPolicy Bypass -File tools\windows\unregister-bw.ps1

$classes = "HKCU:\Software\Classes"
foreach ($key in "$classes\.bw", "$classes\BigWave.File") {
  if (Test-Path $key) { Remove-Item -Path $key -Recurse -Force }
}
Write-Host ".bw ファイルの関連付けを解除しました。"

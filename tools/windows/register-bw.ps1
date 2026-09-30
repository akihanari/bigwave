# .bw ファイルをダブルクリックで BigWave 実行できるようにする（Windows 用）
# 使い方：PowerShell で  powershell -ExecutionPolicy Bypass -File tools\windows\register-bw.ps1
# 解除：unregister-bw.ps1
#
# 書き込むのは今のユーザーの設定（HKCU\Software\Classes）だけ。管理者権限は不要。

$ErrorActionPreference = "Stop"

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "node が見つかりません。Node.js をインストールしてください。" }

$script = (Resolve-Path (Join-Path $PSScriptRoot "..\..\bin\bigwave.js")).Path

# cmd /c "..." で実行し、結果が読めるように最後に pause する
$command = "`"$env:SystemRoot\System32\cmd.exe`" /c `"`"$node`" `"$script`" `"%1`" & echo. & pause`""

$classes = "HKCU:\Software\Classes"
New-Item -Path "$classes\.bw" -Force | Out-Null
Set-ItemProperty -Path "$classes\.bw" -Name "(default)" -Value "BigWave.File"

New-Item -Path "$classes\BigWave.File" -Force | Out-Null
Set-ItemProperty -Path "$classes\BigWave.File" -Name "(default)" -Value "BigWave プログラム"

New-Item -Path "$classes\BigWave.File\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$classes\BigWave.File\shell\open\command" -Name "(default)" -Value $command

Write-Host ".bw ファイルを BigWave に関連付けました。"
Write-Host "実行コマンド：$command"

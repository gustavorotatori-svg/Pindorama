$p = "C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting"
$log = Join-Path $p "dash-log.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"[$date]" | Out-File $log -Append -Encoding UTF8
node (Join-Path $p "metrics.mjs") | Out-File $log -Append -Encoding UTF8
"---" | Out-File $log -Append -Encoding UTF8

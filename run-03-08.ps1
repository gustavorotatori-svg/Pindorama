$ErrorActionPreference = 'Continue'
$dir = 'C:\Users\rotat\OneDrive\READET~1\PINDOR~1\PINDOR~1'
$log = 'C:\Users\rotat\OneDrive\READET~1\PINDOR~1\PINDOR~1\logs\run-03-08.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
Set-Location -LiteralPath $dir

function Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $msg"
  Write-Output $line
  Add-Content -Path $log -Value $line
}

Log '=== INICIO RUN 03/08 ==='

Log 'PASSO 1: esvaziar pendentes (sem email1)'
node pipeline.mjs --send 2>&1 | ForEach-Object { Log $_ }

Log 'PASSO 2: gerar lote de 100'
node fazer-lote.mjs 100 2>&1 | ForEach-Object { Log $_ }

Log 'PASSO 3: enviar lote'
node pipeline.mjs --add-file lote-planilha.json --send 2>&1 | ForEach-Object { Log $_ }

Log 'PASSO 4: follow-ups vencidos (email3 Escalada + grupo 02/08)'
node pipeline.mjs --followup 2>&1 | ForEach-Object { Log $_ }

Log 'PASSO 5: WhatsApp (guardado p/ seg-sab 8h-21h - aborta se fora da janela)'
node send-whatsapp-batch.mjs 2>&1 | ForEach-Object { Log $_ }

Log 'PASSO 6: dashboard'
node metrics.mjs 2>&1 | ForEach-Object { Log $_ }

Log '=== FIM RUN 03/08 ==='

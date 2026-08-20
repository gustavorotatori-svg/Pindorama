param([Parameter(Mandatory = $true)][ValidateSet('pipeline', 'auto-reply', 'weekly-report')][string]$Job)
$ErrorActionPreference = 'Stop'
$projectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeDir = Join-Path $projectDir '.local-automation'
$credentialFile = Join-Path $runtimeDir 'gmail-credential.xml'
$logDir = Join-Path $runtimeDir 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$mutex = [Threading.Mutex]::new($false, 'Local\PindoramaEmailAutomation')
if (-not $mutex.WaitOne(0)) { exit 0 }
$logFile = Join-Path $logDir ("{0}-{1}.log" -f $Job, (Get-Date -Format 'yyyy-MM-dd_HHmmss'))
$plainPassword = $null; $bstr = [IntPtr]::Zero
try {
  if (-not (Test-Path -LiteralPath $credentialFile)) { throw 'Credencial local ausente. Execute o instalador.' }
  $credential = Import-Clixml -LiteralPath $credentialFile
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  $env:GMAIL_USER = $credential.UserName; $env:GMAIL_APP_PASSWORD = $plainPassword
  $env:EMAIL_LIMIT_24H = '35'; $env:TZ = 'America/Sao_Paulo'
  Set-Location -LiteralPath $projectDir
  "$(Get-Date -Format o) START $Job" | Tee-Object -FilePath $logFile
  if ($Job -eq 'pipeline') {
    @('leads-verificados-2026-08-12.json','leads-verificados-2026-08-13-drinks.json','leads-verificados-2026-08-14.json','leads-verificados-2026-08-15-augusta.json','leads-verificados-2026-08-15-cocktail-bars.json') | ForEach-Object {
      if (Test-Path -LiteralPath $_) { & node pipeline.mjs --add-file $_ 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw "Falha ao importar $_" } }
    }
    & node pipeline.mjs --all 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw 'Falha no pipeline.' }
    & node metrics.mjs 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw 'Falha nas metricas.' }
  } elseif ($Job -eq 'auto-reply') {
    & node auto-reply.mjs 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw 'Falha no auto-reply.' }
  } else {
    & node weekly-report.mjs 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar relatorio.' }
    & node enviar-relatorio.mjs 2>&1 | Tee-Object -FilePath $logFile -Append; if ($LASTEXITCODE -ne 0) { throw 'Falha ao enviar relatorio.' }
  }
  "$(Get-Date -Format o) OK $Job" | Tee-Object -FilePath $logFile -Append
} catch { "$(Get-Date -Format o) ERROR $Job - $($_.Exception.Message)" | Tee-Object -FilePath $logFile -Append; exit 1
} finally {
  Remove-Item Env:GMAIL_APP_PASSWORD -ErrorAction SilentlyContinue; $plainPassword = $null
  if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  $mutex.ReleaseMutex(); $mutex.Dispose()
}

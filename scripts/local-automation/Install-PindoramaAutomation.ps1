$ErrorActionPreference = 'Stop'
$projectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtimeDir = Join-Path $projectDir '.local-automation'; $credentialFile = Join-Path $runtimeDir 'gmail-credential.xml'
$runner = Join-Path $PSScriptRoot 'Run-PindoramaJob.ps1'; New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$mailUser = 'cachaca011pindorama@gmail.com'
$securePassword = Read-Host 'Senha de app do Gmail (entrada oculta)' -AsSecureString
[PSCredential]::new($mailUser, $securePassword) | Export-Clixml -LiteralPath $credentialFile
$powerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
function Add-LocalTask([string]$Name,[string]$Job,$Trigger) {
  $action = New-ScheduledTaskAction -Execute $powerShell -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$runner`" -Job $Job" -WorkingDirectory $projectDir
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 45) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $Name -Action $action -Trigger $Trigger -Settings $settings -Description 'Automacao local gratuita Pindorama; nao usa GitHub Actions.' -Force | Out-Null
}
Add-LocalTask 'Pindorama-EmailPipeline' 'pipeline' (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 15))
Add-LocalTask 'Pindorama-AutoReply' 'auto-reply' (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 1))
Add-LocalTask 'Pindorama-WeeklyReport' 'weekly-report' (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '09:00')
# O trigger diario evita que a primeira ocorrencia semanal seja pulada quando a
# instalacao acontece depois das 09:15. O guard do script bloqueia domingos.
Add-LocalTask 'Pindorama-WhatsAppInitial' 'whatsapp' (New-ScheduledTaskTrigger -Daily -At '09:15')
Write-Output 'Automacao local instalada: pipeline 15 min, respostas 1 h, WhatsApp inicial diario 09:15 com guard seg-sab, relatorio domingo 09:00.'

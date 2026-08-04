$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-NoProfile -ExecutionPolicy Bypass -Command "cd ''C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting''; node metrics.mjs | Out-File -FilePath dashboard-log.txt -Append -Encoding UTF8; ''---'' | Out-File -FilePath dashboard-log.txt -Append -Encoding UTF8"'
$trigger1 = New-ScheduledTaskTrigger -Daily -At 06:00
$trigger2 = New-ScheduledTaskTrigger -Daily -At 18:00
Register-ScheduledTask -TaskName "Pindorama Dashboard" -Action $action -Trigger @($trigger1,$trigger2) -RunLevel Highest -Force
if ($?) { Write-Host "Tarefa criada" } else { Write-Host "Erro" }

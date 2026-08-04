# Empacota o projeto Pindorama para deploy na nuvem (Linux)
# Saída: C:\Users\rotat\AppData\Local\Temp\opencode\pindorama-deploy.tar.gz
$ErrorActionPreference = 'Stop'
# Caminho curto 8.3: evita o bug de encoding do "Área de Trabalho" (MODULE_NOT_FOUND / tar vazio)
$src = (Get-Item 'C:\Users\rotat\OneDrive\Área de Trabalho\Pindorama\pindorama-prospecting').FullName
$parent = Split-Path $src -Parent
$name = Split-Path $src -Leaf
$out = 'C:\Users\rotat\AppData\Local\Temp\opencode\pindorama-deploy.tar.gz'
if (Test-Path $out) { Remove-Item $out -Force }

# Usa o caminho 8.3 do pai via cmd (dir /x) para o tar não falhar silenciosamente
$parent83 = (cmd /c "dir /x /ad `"$parent`"" | Select-String "PINDOR~1" | ForEach-Object { ($_.Line -split '\s+')[-1] })
if (-not $parent83) { $parent83 = $parent }

tar.exe -czf $out --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.baileys_auth_old' --exclude='.wwebjs_auth' -C $parent83 $name

$mb = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Output "Pacote criado: $out ($mb MB)"
Write-Output "Para subir: scp $out usuario@IP:/tmp/  e na VM: sudo tar -xzf /tmp/pindorama-deploy.tar.gz -C ~/ && mv ~/pindorama-prospecting ~/pindorama"

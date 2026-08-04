#!/bin/bash
# =========================================================
#  CRON — Prospecção Pindorama
#  Instala as tarefas automáticas equivalentes às do Windows
# =========================================================
cd ~/pindorama || exit 1
mkdir -p logs

# Crontab atual + nova linha, sem duplicar
CRON_FILE=/tmp/pindorama-crontab
crontab -l > "$CRON_FILE" 2>/dev/null || true

add_if_missing() {
  if grep -qF "$1" "$CRON_FILE"; then
    echo "  [ja existe] $1"
  else
    echo "$1" >> "$CRON_FILE"
    echo "  [adicionado] $1"
  fi
}

echo "==> Tarefas agendadas:"
# Run diário todos os dias 08:00
add_if_missing '0 8 * * * bash ~/pindorama/deploy/run-diario.sh'
# Relatório semanal em PDF toda quinta 17:00
add_if_missing '0 17 * * 4 cd ~/pindorama && node weekly-report.mjs >> logs/weekly.log 2>&1'
# Dashboard 06:00 e 18:00
add_if_missing '0 6,18 * * * cd ~/pindorama && node metrics.mjs >> logs/dash.log 2>&1'
# Auto-reply (one-shot) a cada 10 minutos — responde quem respondeu
add_if_missing '*/10 * * * * cd ~/pindorama && node auto-reply.mjs >> logs/auto-reply.log 2>&1'
# WhatsApp: tenta 09:00, 12:00 e 15:00 (guard limita a 4/dia e janela seg-sab)
add_if_missing '0 9,12,15 * * 1-6 cd ~/pindorama && node send-whatsapp-batch.mjs >> logs/whatsapp.log 2>&1'

crontab "$CRON_FILE"
echo ""
echo "==> Cron instalado. Confira com: crontab -l"

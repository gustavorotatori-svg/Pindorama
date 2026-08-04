#!/bin/bash
# =========================================================
#  RUN DIARIO — Prospecção Pindorama (versão Linux do run-diario.ps1)
# =========================================================
cd ~/pindorama || exit 1
STAMP=$(date +%Y-%m-%d_%H%M)
LOG=logs/run-$STAMP.log
mkdir -p logs
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG"; }

log '=== INICIO RUN DIARIO ==='

log 'PASSO 1: esvaziar pendentes (sem email1)'
node pipeline.mjs --send >> "$LOG" 2>&1

log 'PASSO 2: gerar lote de 100'
node fazer-lote.mjs 100 >> "$LOG" 2>&1

log 'PASSO 3: enviar lote'
node pipeline.mjs --add-file lote-planilha.json --send >> "$LOG" 2>&1

log 'PASSO 4: follow-ups vencidos'
node pipeline.mjs --followup >> "$LOG" 2>&1

log 'PASSO 5: WhatsApp (guard: max 4/dia, seg-sab 8h-21h)'
node send-whatsapp-batch.mjs >> "$LOG" 2>&1

log 'PASSO 6: dashboard'
node metrics.mjs >> "$LOG" 2>&1

log '=== FIM RUN DIARIO ==='

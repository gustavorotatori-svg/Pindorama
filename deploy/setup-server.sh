#!/bin/bash
# =========================================================
#  SETUP SERVIDOR — Prospecção Pindorama (Google Cloud e2-micro)
#  Rode com: bash setup-server.sh  (os arquivos devem estar em ~/pindorama)
# =========================================================
set -e
DIR=~/pindorama
cd "$DIR"

echo "==> 1. Pacotes base"
sudo apt-get update -y
sudo apt-get install -y nodejs curl unzip python3

echo "==> 2. Node 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

echo "==> 3. Swap 2GB (e2-micro tem so 1GB de RAM)"
if ! swapon --show | grep -q swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "   Swap criado."
else
  echo "   Swap ja existe."
fi

echo "==> 4. Dependencias do pipeline (sem Next/Firebase p/ economizar RAM)"
npm install --omit=dev --no-audit --no-fund @whiskeysockets/baileys nodemailer imap mailparser qrcode qrcode-terminal

echo "==> 5. PM2 (processos continuos)"
sudo npm install -g pm2
pm2 start monitor.mjs --name pindorama-monitor
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"

echo "==> 6. Servico web p/ o dashboard (porta 8080, opcional)"
echo "   Para servir o dashboard:  python3 -m http.server 8080  (na pasta do projeto)"

echo ""
echo "=============================================="
echo "  SETUP CONCLUIDO!"
echo "  PROXIMO PASSO: parear o WhatsApp"
echo "    node deploy/whatsapp-parear.mjs"
echo "  Depois mantenha a conexao com PM2:"
echo "    pm2 start whatsapp.mjs -- --connect"
echo "  Instale o cron:"
echo "    bash deploy/instalar-cron.sh"
echo "=============================================="

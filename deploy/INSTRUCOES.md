# Migração do Pindorama para Google Cloud (e2-micro grátis)

Objetivo: tirar a prospecção do seu PC (que trava) e rodar 24/7 numa VM gratuita.

## Passo 1 — Criar a VM no Google Cloud

1. Acesse https://console.cloud.google.com e crie uma conta (precisa de cartão SÓ para
   verificação; a e2-micro free não é cobrada).
2. Crie um projeto (ex.: `pindorama-cloud`).
3. Ative a API Compute Engine (Compute Engine > Enable).
4. Crie uma instância:
   - Nome: `pindorama`
   - Região: `us-central1` (ou us-east1) — IMPORTANTE: tem que ser região free
   - **Série/Máquina: E2, tipo `e2-micro`** (2 vCPU compartilhados, 1GB RAM — grátis)
   - Boot disk: Ubuntu 22.04 LTS, 20GB (standard)
   - Marque "Permitir tráfego HTTP" para poder abrir o dashboard
5. Crie um Firewall rule para a porta 3001 (QR do WhatsApp):
   - VPC Network > Firewall > Create rule
   - Name: `http-qr` | Targets: `apply to all` | Source IP: `0.0.0.0/0`
   - Protocolos e portas: TCP `3001`

## Passo 2 — Subir os arquivos

No PC (PowerShell), na pasta do projeto:
```
powershell -File deploy\empacotar.ps1
scp C:\Users\rotat\AppData\Local\Temp\opencode\pindorama-deploy.tar.gz usuario@IP_DA_VM:/tmp/
```
(`usuario` é o do GCP, normalmente seu nome de conta; o IP aparece na tela da VM.)

Depois, conecte na VM (SSH no Console do GCP ou `ssh usuario@IP`) e:
```
sudo tar -xzf /tmp/pindorama-deploy.tar.gz -C /home/usuario/
mv /home/usuario/pindorama-prospecting /home/usuario/pindorama
```

## Passo 3 — Setup do servidor

Na VM:
```
cd ~/pindorama
bash deploy/setup-server.sh
```
Isso instala Node 20, cria swap de 2GB, instala as dependências do pipeline
(baileys, nodemailer, imap, etc.), inicia o monitor com PM2.

## Passo 4 — Parear o WhatsApp

Na VM:
```
node deploy/whatsapp-parear.mjs
```
Abra no navegador do PC: `http://IP_DA_VM:3001` e escaneie o QR no celular
(WhatsApp > Aparelhos conectados). Assim que conectar, o script sai sozinho.

Mantenha a sessão sempre ativa:
```
pm2 start whatsapp.mjs -- --connect
pm2 save
```
(Ou tente primeiro com as credenciais que vieram no pacote — se o celular já tiver
essa sessão, pode nem precisar escanear.)

## Passo 5 — Agendamento automático (cron)

Na VM:
```
bash deploy/instalar-cron.sh
```
Equivalência com as tarefas que você tinha no Windows:
- Run diário 08:00 (pendentes + lote 100 + followups + WhatsApp + dashboard)
- Relatório PDF: quinta 17:00
- Dashboard: 06:00 e 18:00
- Auto-reply: a cada 10 min
- WhatsApp: 09:00 / 12:00 / 15:00 (seg–sáb; guard limita a 4/dia)

## Passo 6 — Verificar

```
pm2 list
tail -f logs/run-*.log
node metrics.mjs
```

## Manutenção

- Dashboard web (opcional): na VM `python3 -m http.server 8080` e abra
  `http://IP:8080/dashboard.html`
- Para o relatório semanal virar PDF, a VM precisa de Chrome headless. Instale:
  `sudo apt-get install -y google-chrome-stable` (ou `chromium`) e ajuste o caminho
  no weekly-report.mjs se necessário.
- Desligue o uso local quando estiver tudo na nuvem: os scripts continuam no PC
  como backup, mas não rode nada por lá.

## ⚠️ Segurança

- Os scripts contêm a App Password do Gmail HARDCODED. NUNCA dê push para um
  repositório GitHub público. Se for usar git, crie um repo PRIVADO.
- Se um dia quiser tirar a senha dos scripts, substitua por leitura de variável
  de ambiente (process.env.MAIL_PASS).

# Setup Prospecção Pindorama

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  SETUP - Prospecção Pindorama" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Firebase
Write-Host "1. FIREBASE" -ForegroundColor Yellow
Write-Host "   Acesse: https://console.firebase.google.com"
Write-Host "   Crie um projeto e cole os dados abaixo:"
Write-Host ""

$FIREBASE_API_KEY = Read-Host "   API Key"
$FIREBASE_AUTH_DOMAIN = Read-Host "   Auth Domain (ex: projeto.firebaseapp.com)"
$FIREBASE_PROJECT_ID = Read-Host "   Project ID"
$FIREBASE_STORAGE_BUCKET = Read-Host "   Storage Bucket (ex: projeto.appspot.com)"
$FIREBASE_SENDER_ID = Read-Host "   Messaging Sender ID"
$FIREBASE_APP_ID = Read-Host "   App ID"

Write-Host ""
Write-Host "2. GOOGLE MAPS" -ForegroundColor Yellow
Write-Host "   Acesse: https://console.cloud.google.com"
Write-Host "   Ative a 'Places API' e gere uma chave:"
Write-Host ""

$GOOGLE_MAPS_KEY = Read-Host "   API Key do Google Maps"

Write-Host ""
Write-Host "3. RESEND (para envio de emails)" -ForegroundColor Yellow
Write-Host "   Acesse: https://resend.com"
Write-Host "   Crie conta e gere uma API Key:"
Write-Host ""

$RESEND_KEY = Read-Host "   API Key do Resend"

# Criar arquivo .env.local
$envContent = @"
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID

# Google Maps
GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY

# Resend
RESEND_API_KEY=$RESEND_KEY
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  ✅ Configuração concluída!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o sistema, execute:" -ForegroundColor Cyan
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Ou para deploy no Vercel:" -ForegroundColor Cyan
Write-Host "  vercel"
Write-Host ""

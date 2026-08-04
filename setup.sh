#!/bin/bash

echo "========================================="
echo "  SETUP - Prospecção Pindorama"
echo "========================================="
echo ""

# Firebase
echo "1. FIREBASE"
echo "   Acesse: https://console.firebase.google.com"
echo "   Crie um projeto e cole os dados abaixo:"
echo ""

read -p "   API Key: " FIREBASE_API_KEY
read -p "   Auth Domain (ex: projeto.firebaseapp.com): " FIREBASE_AUTH_DOMAIN
read -p "   Project ID: " FIREBASE_PROJECT_ID
read -p "   Storage Bucket (ex: projeto.appspot.com): " FIREBASE_STORAGE_BUCKET
read -p "   Messaging Sender ID: " FIREBASE_SENDER_ID
read -p "   App ID: " FIREBASE_APP_ID

echo ""
echo "2. GOOGLE MAPS"
echo "   Acesse: https://console.cloud.google.com"
echo "   Ative a 'Places API' e gere uma chave:"
echo ""

read -p "   API Key do Google Maps: " GOOGLE_MAPS_KEY

echo ""
echo "3. RESEND (para envio de emails)"
echo "   Acesse: https://resend.com"
echo "   Crie conta e gere uma API Key:"
echo ""

read -p "   API Key do Resend: " RESEND_KEY

# Criar arquivo .env.local
cat > .env.local << EOF
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
EOF

echo ""
echo "========================================="
echo "  ✅ Configuração concluída!"
echo "========================================="
echo ""
echo "Para iniciar o sistema, execute:"
echo "  npm run dev"
echo ""
echo "Ou para deploy no Vercel:"
echo "  vercel"
echo ""

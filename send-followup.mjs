import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const leadsPath = join(process.cwd(), 'leads.json');
const leads = JSON.parse(readFileSync(leadsPath, 'utf8'));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const signature = `
---
Gustavo
Pindorama - Cachaça Artesanal
📧 cachaca011pindorama@gmail.com
📞 (11) 91357-7900
🌐 cachaca011pindorama@gmail.com`;

const email2Body = `Olá,

Tudo bem? Enviei uma mensagem há alguns dias sobre a Pindorama, uma cachaça artesanal produzida no Vale do Café, Rio de Janeiro.

Nossa cachaça é única porque os canaviais orgânicos são cercados por quase 200 hectares de Mata Atlântica, dentro de uma zona de proteção permanente.

Temos parcerias com hotéis, bares e restaurantes sofisticados como Fasano, Hilton, Rosewood e Emiliano.

Gostaria de oferecer uma amostra gratuita para que vocês conheçam a qualidade Pindorama.

Posso enviar as amostras?${signature}`;

const email3Body = `Olá,

Espero que esteja tudo bem!

Esta é minha última mensagem sobre a Pindorama. Se não for o momento ideal, sem problemas!

Caso tenha interesse no futuro, estou à disposição. Nossa cachaça é uma opção premium para bares, restaurantes e hotéis que buscam qualidade e exclusividade.

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
📞 (11) 91357-7900
📧 cachaca011pindorama@gmail.com
🌐 cachaca011pindorama@gmail.com`;

function daysSince(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = today - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function sendFollowUps() {
  let updated = false;

  for (const lead of leads) {
    const days = daysSince(lead.date1);

    // Day 3 follow-up
    if (days >= 3 && !lead.email2 && lead.email1) {
      try {
        await transporter.sendMail({
          from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
          to: lead.email,
          subject: `Pindorama - Amostra Gratuita para ${lead.name}`,
          text: email2Body,
        });
        console.log(`✅ [Dia 3] ${lead.name} (${lead.email})`);
        lead.email2 = true;
        lead.date2 = new Date().toISOString().split('T')[0];
        updated = true;
      } catch (error) {
        console.error(`❌ [Dia 3] ${lead.name}: ${error.message}`);
      }
    }

    // Day 5 follow-up
    if (days >= 5 && !lead.email3 && lead.email2) {
      try {
        await transporter.sendMail({
          from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
          to: lead.email,
          subject: `Pindorama - Última Mensagem para ${lead.name}`,
          text: email3Body,
        });
        console.log(`✅ [Dia 5] ${lead.name} (${lead.email})`);
        lead.email3 = true;
        lead.date3 = new Date().toISOString().split('T')[0];
        updated = true;
      } catch (error) {
        console.error(`❌ [Dia 5] ${lead.name}: ${error.message}`);
      }
    }
  }

  if (updated) {
    writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
    console.log('\n📁 leads.json atualizado');
  } else {
    console.log('\n⏳ Nenhum follow-up necessário hoje');
  }
}

sendFollowUps();

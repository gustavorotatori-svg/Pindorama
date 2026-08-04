const { readFileSync, writeFileSync } = await import('fs');

const leads = JSON.parse(readFileSync('leads.json', 'utf-8'));
const today = '2026-07-27';

// Marcar os 2 que foram enviados (Bar do Juarez, Iulia Itaim) + os que estavam no processo (Bar Charles Edward)
const sentEmails = [
  'isabella@bardojuarez.com.br',
  'reserva@iulia.com.br',
  'marketing@barcharles.com.br',
  'contato@dopabar.com.br',
  'info@seogomes.com.br',
  'gero@fasano.com.br',
  'restaurante@fasano.com.br',
  'contato@ristorantino.com.br',
  'reservas@mirogastronomia.com.br',
  'reservas@wzhoteljardins.com.br',
  'reservas@hoteltrianon.com.br',
  'melia.jardim.europa@solmelia.com',
  'comercial.adegabianchi@gmail.com',
];

for (const lead of leads) {
  if (sentEmails.includes(lead.email)) {
    lead.email2 = true;
    lead.date2 = today;
    console.log(`✅ ${lead.name} — email2 marcado`);
  }
}

writeFileSync('leads.json', JSON.stringify(leads, null, 2));
console.log('\nleads.json atualizado');

const { readFileSync, writeFileSync } = await import('fs');

const leads = JSON.parse(readFileSync('leads-qualificados.json', 'utf-8'));
const today = '2026-07-27';

// Todos os 16 foram enviados (exceto higienopolishotel — inválido)
const sentEmails = [
  'contato@bardonerso.com.br',
  'restaurantebarak@gmail.com',
  'moema@fogodechao.com.br',
  'contato@adegasantiago.com.br',
  'reserva@thegrausbar.com.br',
  'gero.itaim@fasano.com.br',
  'contato@ryogastronomia.com.br',
  'terraco.jardins@marriott.com',
  'reservas.pullmanvilaolimpia@accor.com',
  'info@manifestobar.com.br',
  'reservas@theworld.com.br',
  'saopaulo.restaurantes@rosewoodhotels.com',
  'contato@grupofito.com.br',
  'contato@grupo-ftr.com',
  'contato@bernardinorestaurante.com.br',
  'tacosp@tacosp.com.br',
];

for (const lead of leads) {
  if (sentEmails.includes(lead.email)) {
    lead.email1 = true;
    lead.date1 = today;
    console.log(`✅ ${lead.name} — email1 marcado`);
  }
}

writeFileSync('leads-qualificados.json', JSON.stringify(leads, null, 2));
console.log('\nleads-qualificados.json atualizado');

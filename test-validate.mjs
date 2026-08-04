const dns = await import('dns/promises');
const { readFileSync } = await import('fs');

const leads = JSON.parse(readFileSync('leads.json', 'utf-8'));

console.log(`\n=== VALIDAÇÃO DE EMAILS — ${leads.length} leads ===\n`);

let valid = 0;
let invalid = 0;

for (const lead of leads) {
  const domain = lead.email.split('@')[1];
  try {
    const mx = await dns.resolveMx(domain);
    if (mx && mx.length > 0) {
      valid++;
      console.log(`✅ ${lead.email} → MX: ${mx[0].exchange}`);
    } else {
      invalid++;
      console.log(`❌ ${lead.email} → Sem registros MX`);
    }
  } catch (e) {
    invalid++;
    console.log(`❌ ${lead.email} → ${e.code}: ${e.message}`);
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`✅ Válidos: ${valid}`);
console.log(`❌ Inválidos: ${invalid}`);
console.log(`📊 Taxa de validade: ${((valid / leads.length) * 100).toFixed(1)}%`);

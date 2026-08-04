import dns from 'dns';
import { resolveMx } from 'dns/promises';

/**
 * Valida se o domínio de um email possui registros MX válidos.
 * Retorna { valid: boolean, reason: string, mx: string[] }
 */
export async function validateEmail(email) {
  const domain = email.split('@')[1];

  if (!domain) {
    return { valid: false, reason: 'Email inválido — sem domínio', mx: [] };
  }

  try {
    const mxRecords = await resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `Domínio ${domain} não possui registros MX`, mx: [] };
    }

    return {
      valid: true,
      reason: 'OK',
      mx: mxRecords.map(r => r.exchange),
    };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { valid: false, reason: `Domínio ${domain} não existe (DNS NXDOMAIN)`, mx: [] };
    }
    return { valid: false, reason: `Erro DNS: ${err.message}`, mx: [] };
  }
}

/**
 * Valida uma lista de leads e retorna apenas os válidos.
 * Retorna { valid: [...], invalid: [...] }
 */
export async function validateLeads(leads) {
  const results = { valid: [], invalid: [] };

  for (const lead of leads) {
    const result = await validateEmail(lead.email);

    if (result.valid) {
      results.valid.push({ ...lead, mx: result.mx });
    } else {
      results.invalid.push({ ...lead, reason: result.reason });
    }
  }

  return results;
}

// Se executado diretamente, valida emails de um JSON
const isMain = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMain || process.argv[1]?.includes('validate-emails')) {
  const { readFileSync } = await import('fs');
  const filePath = process.argv[2] || 'leads.json';
  const leads = JSON.parse(readFileSync(filePath, 'utf-8'));

  console.log(`\n=== VALIDAÇÃO DE EMAILS — ${leads.length} leads ===\n`);

  const results = await validateLeads(leads);

  console.log(`✅ VÁLIDOS: ${results.valid.length}`);
  for (const lead of results.valid) {
    console.log(`  ${lead.email} → MX: ${lead.mx[0]}`);
  }

  console.log(`\n❌ INVÁLIDOS: ${results.invalid.length}`);
  for (const lead of results.invalid) {
    console.log(`  ${lead.email} → ${lead.reason}`);
  }
}

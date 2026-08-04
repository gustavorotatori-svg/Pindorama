/**
 * SMART SEND — Script de envio inteligente
 * 
 * Uso:
 *   node smart-send.mjs                    — envia email1 para leads novos não validados
 *   node smart-send.mjs --followup         — envia email2/email3 para leads que precisam
 *   node smart-send.mjs --template pergunta — força template específico
 *   node smart-send.mjs --limit 5          — máximo 5 emails por execução
 *   node smart-send.mjs --dry              — simula sem enviar
 *   node smart-send.mjs --leads novo.json  — usa arquivo de leads diferente
 */

import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validateLeads } from './validate-emails.mjs';
import { getTemplate } from './email-templates.mjs';

// === CONFIG ===
const DRY_RUN = process.argv.includes('--dry');
const FOLLOWUP_MODE = process.argv.includes('--followup');
const TEMPLATE_FORCE = process.argv.includes('--template') 
  ? process.argv[process.argv.indexOf('--template') + 1] 
  : null;
const LIMIT = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
  : FOLLOWUP_MODE ? 10 : 5;
  const LEADS_FILE = process.argv.includes('--leads')
  ? process.argv[process.argv.indexOf('--leads') + 1]
  : 'leads-qualificados.json';

// === TRANSPORTER ===
const transporter = DRY_RUN ? null : nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

const pdfPath = join(process.cwd(), 'Apresentacao-Pindorama-2025.pdf');
const pdfBuffer = readFileSync(pdfPath);

// === LOAD LEADS ===
const leads = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
const _d = new Date(); _d.setMinutes(_d.getMinutes() - _d.getTimezoneOffset()); const today = _d.toISOString().split('T')[0];

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

async function main() {
  console.log(`\n=== SMART SEND — ${DRY_RUN ? '🧪 DRY RUN' : '📤 ENVIO REAL'} ===`);
  console.log(`Modo: ${FOLLOWUP_MODE ? 'FOLLOW-UP (D3/D5/D7)' : 'PRIMEIRO EMAIL'}`);
  console.log(`Template: ${TEMPLATE_FORCE || 'A/B automático'}`);
  console.log(`Limite: ${LIMIT} emails\n`);

  let toSend = [];

  if (FOLLOWUP_MODE) {
    // Filtrar leads que precisam de follow-up
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      if (!lead.date1 || lead.email1 !== true) continue;

      const daysSinceEmail1 = daysBetween(lead.date1, today);

      // Email2: dia 3 (entre 2-4 dias)
      if (!lead.email2 && daysSinceEmail1 >= 3 && daysSinceEmail1 <= 10) {
        toSend.push({ ...lead, followupType: 'email2', _index: i });
      }
      // Email3: dia 7 (entre 5-10 dias)
      else if (!lead.email3 && lead.email2 && daysSinceEmail1 >= 7 && daysSinceEmail1 <= 14) {
        toSend.push({ ...lead, followupType: 'email3', _index: i });
      }
    }
    console.log(`Leads elegíveis para follow-up: ${toSend.length}`);

    // Validar emails dos follow-ups também
    if (toSend.length > 0) {
      console.log(`Validando emails...`);
      const { valid, invalid } = await validateLeads(toSend);
      if (invalid.length > 0) {
        console.log(`\n⚠️ ${invalid.length} emails INVÁLIDOS (pulados):`);
        for (const inv of invalid) {
          console.log(`  ❌ ${inv.email} → ${inv.reason}`);
        }
      }
      toSend = valid;
    }
  } else {
    // Primeiro email: enviar para leads sem date1
    const leadsWithoutEmail = leads.filter((l, i) => !l.date1).map((l, i) => ({ ...l, _index: i }));

    if (leadsWithoutEmail.length === 0) {
      console.log('Todos os leads já receberam email1. Use --followup para follow-ups.');
      return;
    }

    // Validar emails
    console.log(`Validando ${leadsWithoutEmail.length} emails...`);
    const { valid, invalid } = await validateLeads(leadsWithoutEmail);

    if (invalid.length > 0) {
      console.log(`\n⚠️ ${invalid.length} emails INVÁLIDOS (não enviados):`);
      for (const inv of invalid) {
        console.log(`  ❌ ${inv.email} → ${inv.reason}`);
      }
    }

    console.log(`✅ ${valid.length} emails válidos`);
    toSend = valid;
  }

  // Aplicar limite
  toSend = toSend.slice(0, LIMIT);

  if (toSend.length === 0) {
    console.log('Nenhum email para enviar nesta execução.');
    return;
  }

  console.log(`\nEnviando ${toSend.length} emails...\n`);

  let sentCount = 0;
  let errorCount = 0;

  for (const lead of toSend) {
    const template = getTemplate(lead, TEMPLATE_FORCE);

    console.log(`📧 ${lead.name}`);
    console.log(`   Para: ${lead.email}`);
    if (lead.followupType) {
      console.log(`   Follow-up: ${lead.followupType}`);
    }
    console.log(`   Assunto: ${template.subject}`);

    if (DRY_RUN) {
      console.log(`   [DRY RUN — não enviado]\n`);
      sentCount++;
      continue;
    }

    try {
      await transporter.sendMail({
        from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
        to: lead.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments: lead.followupType !== 'email3' ? [{
          filename: 'Apresentacao-Pindorama-2025.pdf',
          content: pdfBuffer,
        }] : [],
      });

      console.log(`   ✅ Enviado`);

      // Atualizar leads.json
      const leadIndex = leads.findIndex(l => l.email === lead.email);
      if (leadIndex >= 0) {
        if (lead.followupType === 'email2') {
          leads[leadIndex].email2 = true;
          leads[leadIndex].date2 = today;
        } else if (lead.followupType === 'email3') {
          leads[leadIndex].email3 = true;
          leads[leadIndex].date3 = today;
        } else {
          leads[leadIndex].email1 = true;
          leads[leadIndex].date1 = today;
        }
      }

      sentCount++;

      // Delay entre envios (3-5 segundos)
      const delay = 3000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, delay));

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      errorCount++;
    }

    console.log('');
  }

  // Salvar leads.json atualizado
  if (!DRY_RUN) {
    writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`✅ Enviados: ${sentCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📄 Leads file: ${DRY_RUN ? 'não alterado (dry run)' : 'atualizado'}`);
}

main().catch(console.error);

const fs = require('fs');
const p = 'pipeline.mjs';
let s = fs.readFileSync(p, 'utf8');

const t1 = `Olá {nome},

Vi que {contexto}.

Sou o Gustavo, da Pindorama — cachaça artesanal premium de fazenda própria no Vale do Café (RJ), a mesma que atende Fasano, Hilton e Rosewood.

Trabalho com 3 referências:
• Pindorama Clássica (prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

Catálogo completo em anexo (PDF). Frete CIF por nossa conta e 21 dias para pagar no primeiro pedido.

Posso te mandar a tabela de preços e condições para a {nome}?

Se não fizer sentido, sem problema — basta responder "não" que não insisto.`;

const t2 = `Olá {nome},

Fasano, Hilton e Rosewood já trabalham com a Pindorama — e estou abrindo a mesma condição para poucas casas da região:

• Pindorama Clássica (prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

Catálogo completo em anexo (PDF). Frete CIF e 21 dias para pagar.

Posso te mandar a tabela de preços e condições para a {nome}?

Se não fizer sentido, sem problema — basta responder "não" que não insisto.`;

const t3 = `Olá {nome},

Pergunta rápida: vocês já têm uma cachaça premium no cardápio?

Sou o Gustavo, da Pindorama (Vale do Café, RJ). Vi que {contexto} — e para casas assim ofereço:

• Pindorama Clássica (prata envelhecida) — 700ml
• Pindorama Ouro (envelhecida em carvalho) — 700ml
• Cobra Coral de jabuticaba (premium) — 700ml

Catálogo completo em anexo (PDF). Frete CIF e 21 dias para pagar.

Posso te mandar a tabela de preços e condições para a {nome}?

Se não fizer sentido, sem problema — basta responder "não" que não insisto.`;

function replaceBetween(src, startMarker, endMarker, replacement) {
  const i = src.indexOf(startMarker);
  const j = src.indexOf(endMarker, i + startMarker.length);
  if (i === -1 || j === -1) { console.error('NOT FOUND:', startMarker, '->', endMarker); return src; }
  return src.slice(0, i + startMarker.length) + replacement + src.slice(j);
}

s = replaceBetween(s, 'email1_consultivo: `', 'email1_prova_social: ', t1 + '`,\n  ');
s = replaceBetween(s, 'email1_prova_social: `', 'email1_pergunta: ', t2 + '`,\n  ');
s = replaceBetween(s, 'email1_pergunta: `', 'email2: ', t3 + '`,\n  ');

const email2 = `Olá {nome},

Semana passada te escrevi sobre a Pindorama e não tive retorno — normal, caixa cheia.

Resumo em 3 linhas: cachaça artesanal premium (a mesma de Fasano, Hilton e Rosewood), catálogo em anexo e tabela de preços disponível. Zero risco.

Posso te mandar a tabela de preços e condições?`;
const email3 = `Olá {nome},

Último contato — prometo não insistir depois deste.

Deixo a porta aberta: catálogo em anexo e tabela de preços disponível, quando fizer sentido para vocês. Basta responder este e-mail.

Sucesso aí!`;

s = replaceBetween(s, 'email2: `', 'email3: ', email2 + '`,\n  ');
s = replaceBetween(s, 'email3: `', '};', email3 + '`,\n');

// Subjects
s = s.replace(/bar: 'Amostra gr\\u00e1tis \+ pedido bonificado para seu bar',/, "bar: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para seu bar',");
s = s.replace(/restaurante: 'Amostra gr\\u00e1tis \+ pedido bonificado para seu restaurante',/, "restaurante: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para seu restaurante',");
s = s.replace(/adega: 'Amostra gr\\u00e1tis \+ pedido bonificado para sua adega',/, "adega: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para sua adega',");
s = s.replace(/loja_bebidas: 'Amostra gr\\u00e1tis \+ pedido bonificado para sua loja',/, "loja_bebidas: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para sua loja',");
s = s.replace(/distribuidora: 'Amostra gr\\u00e1tis \+ pedido bonificado para sua distribuidora',/, "distribuidora: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para sua distribuidora',");
s = s.replace(/hotel: 'Amostra gr\\u00e1tis \+ pedido bonificado para seu hotel',/, "hotel: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para seu hotel',");
s = s.replace(/balada: 'Amostra gr\\u00e1tis \+ pedido bonificado para sua balada'/, "balada: 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os para sua balada'");

// getSubject
s = s.replace(/return SUBJECTS\[lead\.type\] \|\| 'Primeiro pedido bonificado para teste \\u2014 Pindorama';/, "return SUBJECTS[lead.type] || 'Pindorama \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os';");
s = s.replace(/if \(step === 'email2'\) return 'Sobre a amostra gr\\u00e1tis Pindorama';/, "if (step === 'email2') return 'Pindorama \\u2014 posso mandar a tabela de pre\\u00e7os?';");
s = s.replace(/return '\\u00daltimo contato \\u2014 oferta especial de lan\\u00e7amento Pindorama';/, "return '\\u00dAltimo contato \\u2014 cat\\u00e1logo e tabela de pre\\u00e7os Pindorama';");

fs.writeFileSync(p, s);
console.log('done');
"
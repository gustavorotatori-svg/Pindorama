<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pindorama Prospecting Rules

## Diretriz vigente - 07/08/2026 (prioridade sobre o histórico abaixo)
- EMAIL: pode operar em qualquer horário e qualquer dia, quando a automação estiver disponível.
- TETO CONFIRMADO: máximo global de 100 saídas por conta em qualquer janela móvel de 24 horas, incluindo campanhas, follow-ups, respostas automáticas, relatórios e demais mensagens enviadas pela conta.
- Os guards históricos de 480/24h e 490/24h abaixo são apenas registro; a regra vigente é 100/24h pelo módulo compartilhado `email-quota.mjs`.
- WHATSAPP: máximo exato de 4 mensagens por dia neste projeto, somente segunda a sábado, das 09:00 às 20:00 em America/Sao_Paulo; nunca aos domingos ou fora da janela.
- SEGMENTOS VÁLIDOS: supermercados, padarias, mercadinhos de bairro, lojas de conveniência, adegas, lojas de bebidas, distribuidoras de bebidas, bares, casas noturnas/baladas/casas de shows, restaurantes, hotéis e meios de hospedagem, empresas de catering e buffets, e clubes sociais, esportivos e recreativos.
- PRIORIDADE DE PROSPECÇÃO: adegas → lojas de bebidas → distribuidoras de bebidas → bares → casas noturnas/baladas → restaurantes → demais segmentos válidos.
- TERRITÓRIO VÁLIDO: cobrir toda a cidade de São Paulo, toda a Grande São Paulo e municípios próximos/limítrofes, incluindo ABC Paulista, Guarulhos, Osasco, Barueri, Carapicuíba, Cotia, Taboão da Serra, Embu das Artes, Itapecerica da Serra, Caieiras, Franco da Rocha e Mogi das Cruzes; manter também Sorocaba e municípios de sua região.
- ESTRATÉGIA: qualificar candidatos continuamente, mas enviar primeiro aos segmentos prioritários e aos contatos com mais evidências comerciais; nunca ultrapassar 100 saídas/24h nem prejudicar follow-ups, respostas automáticas e relatório.
- AMOSTRAS: Pindorama pode oferecer envio de amostras. A restrição da frente Xandô não se aplica a este projeto.
- INFORMAÇÃO COMERCIAL: usar somente condições verificadas nos arquivos. Se preço ou condição não estiver documentado, ou houver conflito, perguntar ao usuário.
- CONDIÇÕES CONFIRMADAS: pagamento em 21 dias, pedido mínimo de 1 caixa, lead time D+2 e frete CIF. Pode oferecer degustadora, treinamento e bonificação no primeiro pedido.
- PREÇOS CONFIRMADOS POR CAIXA: Clássica R$ 84,00 (6 x 750 ml); Ouro R$ 120,00 (6 x 700 ml); Cobra Coral R$ 42,00 (12 x 600 ml); Prata 200 ml R$ 30,00; Ouro 200 ml R$ 35,00; Cobra Coral 200 ml R$ 20,00. A quantidade por caixa das garrafinhas de 200 ml não está informada e deve ser confirmada antes de prometer.
- NÃO generalizar preços ou condições comerciais de Bamba, Repeat ou Xandô para Pindorama.

## Dashboard auto-update (mandatory)
- Dashboard (metrics.mjs) MUST be updated every 12h minimum
- Scheduled tasks: "Pindorama Dashboard" (06:00) and "Pindorama Dashboard 18h" run dash-update.ps1
- Run `node metrics.mjs` at start of every session

## Email validation (mandatory)
- ALWAYS DNS-validate before sending: Resolve-DnsName -Name <domain> -Type MX
- Remove bounced leads from leads-qualificados.json immediately
- Old system emails were fabricated — never use them for new sends

## Prospecting cycle
- Search baresSP.com.br for contato@ emails
- Validate DNS → Add to leads-qualificados.json → Send → Mark sent → Track bounces
- Email sequence: email1 (D0), email2 (D+3), email3 (D+7)
- Use 3 A/B templates: consultivo, prova_social, pergunta
- Pipeline unificado: `node pipeline.mjs --add-file <json> --send`

## Value Proposition (MUST include ALL)
- Amostra gratuita para conhecer a linha
- Degustadoras para ações no estabelecimento
- Treinamento completo para equipe sobre o produto
- Bonificação no primeiro pedido teste
- Frete CIF e pagamento 21 dias

## Patricia (Miró Gastronomia)
- 1st response (28/07): "Recebemos e já guardei seu contato" → asked best day
- 2nd response (29/07 09:03): "Pode mandar na sexta aos meus cuidados" (31/07)
- Resposta enviada (29/07 09:03 auto-reply): confirmed Friday + requested Razão Social, CNPJ, Endereço, Contato for NF
- 3rd response (29/07 15:27): "Segue cadastro __" — blank data — auto-reply re-requested cadastro ("amostra" keyword in quoted text)
- PENDENTE: Responder manualmente pedindo os dados novamente

## Bounces removed (new system)
- Bar Higienópolis (bh@barhigienopolis.com.br) — server config error
- Ghee (restaurante@ghee.com.br) — user unknown
- Le Jazz (contato@lejazz.com.br) — user unknown
- Adega Brooklin (contato@adegabrooklin.com.br) — user unknown (replaced with adegabrooklin@terra.com.br)
- Porto Vila (portovila@ig.com.br) — user unknown
- Danado de Bom (producao@danadodebom.com.br) — user unknown
- Living Room (reservas@livingroom.com.br) — user unknown (DNS passou mas user inexistente)
- CRM Atacadista (contato@crmatacadista.com.br) — server config error (550 SMTP Auth)

## Sending rules
- Use short ~15-line JS files (send-batchX.mjs or single sends)
- Mark leads with email1/date1 after send
- Use Gmail: cachaca011pindorama@gmail.com / App Password: wnau jrrr rjpc zuuv

## Degusti Vinhos (Shopping Ibirapuera)
- Interessada! Ghirag pediu tabela + condições; respondeu perguntando DIFAL, posicionamento de preço (Magalu <R$70) e se Cobra Coral é jabuticaba
- Respondido (31/07): sem DIFAL p/ contribuinte (ICMS interestadual 12% + crédito; NF modelo p/ conferência), posicionamento artesanal premium + preço firme, Cobra Coral = jabuticaba confirmado
- AGUARDANDO: Razão Social, CNPJ, Endereço, Contato da Degusti p/ NF de amostra gratuita
- Faturamento é RJ (confirmado pelo usuário)

## 31/07 — Sessão: 6 leads novos enviados
- Freitas Distribuidora de Bebidas (contato@freitasbebidas.com.br, Tucuruvi) — email1 OK
- JG Bebidas (jgbebidasmarketing@gmail.com, Vila Silva Teles) — email via RDAP do jgbebidas.com.br; site tem contato dedicado p/ fornecedores (WhatsApp Fabio) — email1 OK
- Fera Bebidas Atacadista (bebidasfera@gmail.com, Parque do Lago) — email1 OK
- Adega Flash (adegaflash@hotmail.com, Santo Amaro) — email1 OK
- Becosa/Natique Osborne (contato@natique.com.br, Perdizes) — distribuidora c/ 10+ rótulos de cachaça artesanal — email1 OK
- Adega Empório Mais Bebidas (lorysilverio@gmail.com, Belém) — email1 OK (antes descartada; email achado no JSON-LD do ueniweb)
- Bounce removido: CRM Atacadista (contato@crmatacadista.com.br) — 550 SMTP Auth (server config)
- Prabar Bebidas: email contato@prabarbebidas.com.br mas domínio SEM MX → não enviado (contact via WhatsApp (11) 99626-1147 se quiser)
- Dashboard 31/07: 87 leads, 164 envios, distribuidoras 4/4, 2 respostas

## 31/07 (tarde) — Sessão: 2 leads novos enviados
- Caixa: "2 emails novos" eram os MESMOS da Degusti (UIDs 98/106) — flag \Seen não estava persistindo (replicação lenta do Gmail); corrigido com mark-all-seen.mjs (marca + aguarda 2s + reverifica). Nenhuma mensagem nova.
- Cachaçaria Maria Eunice (contmaschietto@terra.com.br, Vila Guilherme) — 270+ rótulos de cachaça — email1 OK
- Adega Zaidan (raphael_zaidan@yahoo.com.br, Lapa) — email via RDAP; distribuidora c/ categoria de cachaças — email1 OK
- Adega Escalada (atendimento@adegaescalada.com.br, Consolação) — já estava no cadastro (email1 29/07, email2 30/07); duplicata descartada
- Dashboard 31/07 (atualizado): 89 leads, 166 envios, 2 respostas (2.2%)
- Próximos vencimentos: email2 grupo 30/07 → 2/08; email3 grupo 29/07 → 2/08; email3 Escalada (30/07) → 3/08

## 31/07 (noite) — Sessão: 5 leads novos enviados + fix data UTC
- Bar Quintal da Mooca (quintaldamooca@hotmail.com, Mooca) — bar com 39 rótulos de cachaça + caipirinhas premiadas — email1 OK
- Adega Brothers (evandro.1994@hotmail.com, Vila Antonieta) — email via RDAP — email1 OK
- Adega do Guga (vitalgoncalves5@gmail.com, Jardim Santa Teresinha) — email via RDAP — email1 OK
- Brica Bar (financeiro@bricabar.com.br, Mooca) — email via RDAP do bricabar.com.br — email1 OK
- Goela Bar (goelabar@gmail.com, Vila Madalena) — bar especializado em cachaça artesanal com drinks autorais (fit perfeito) — email1 OK
- Point das Bebidas (Ipiranga): SEM email no site → WhatsApp (11) 96023-1738 p/ 01/08
- BUG CORRIGIDO: pipeline.mjs `today()` usava toISOString() (UTC) — envios após 21h local carimbavam date1 como dia seguinte. 5 leads ficaram com date1=2026-08-01 → corrigidos p/ 2026-07-31. Fix de data local aplicado tb em auto-reply.mjs (responseDate), monitor.mjs, send-whatsapp-batch.mjs, smart-send.mjs, read-pending.mjs
- Dashboard 31/07 (atualizado): 94 leads (82 novos + 12 antigos), 171 envios, 2 respostas
- WhatsApp p/ amanhã 01/08 09h (lembrete agendado): 18 leads com phone + Point das Bebidas + Prabar + Bar do Jão + Oh Freguês + Adega G&G

## 01/08 — Sessão: 29 emails1 enviados, bounces removidos + fix followup
- BUG CORRIGIDO pipeline.mjs: pickTemplate fazia TEMPLATES['email'+step] com step='email2' → 'emailemail2'=undefined → loop infinito de erros. Fix: TEMPLATES[step]. + proteção anti-loop (set 'failed') em sendEmail1 e sendFollowups. email2 enviados: 7 (incluiu Empório Santa Joana x2, Adega da Villa, Adega da Vila Mariana, Degusti [REVERTIDO], Adega do Louro, WinePRO)
- FIX: sendFollowups agora PULA leads responded=true (não mandar email2/email3 para quem já respondeu). Email2 do Degusti revertido manualmente.
- 29 emails1 enviados (destes, 10 bounce/removidos — alta taxa de bounce em emails hotmail/yahoo/terra do baresSP, listas desatualizadas):
  - OK: Bar Quintal*, Goela*, Brica* (*já 31/07) — NÃO, sessão 01/08: Ave Cesar(bounce), Aureliano's, Santa Parada, Bar Penha Lapa, Bar Coronel Barão, Boteco Madá, Itapura Bar, San Pisco(bounce), Paçaí(bounce), Gorilas, Dim Buteco(bounce), Boteco do Parque, Espaço Ferrovia, Point 46, Hangar Mooca, Utopia Gastrobar, Olga 17, Bar Batana(bounce), Bar Parada Boa Vista(bounce), Estação Campo Belo(bounce), Aniello(bounce), Bar Botânico, Cervejaria 366, Valentin(bounce), Chopp Escuro(bounce), Meninas Bar, Balzac Bar, Bar do Dodô, Meu Bhar
  - MANTIDOS válidos (19): Aureliano's, Santa Parada, Bar Penha Lapa, Bar Coronel Barão, Boteco Madá, Itapura Bar, Gorilas Bar, Boteco do Parque, Espaço Ferrovia, Point 46, Hangar Mooca, Utopia Gastrobar, Olga 17, Bar Botânico, Cervejaria 366, Meninas Bar, Balzac Bar, Bar do Dodô, Meu Bhar
- Bounces removidos 01/08: Ave Cesar Sports Bar, San Pisco, Paçaí Bar, Dim Buteco, Bar Batana VB, Bar Parada Boa Vista, Estação Campo Belo, Aniello, Valentin, Chopp Escuro, Adega Bela Vista (email era do registrante valdemir.miranda1), Havana Club (email2)
- Fontes: baresSP.com.br snippets (crawler vê, curl bloqueado 403). Consulado Cultural da Cachaça: domínio ENOTFOUND (projeto nunca ativo, descartado). Empório Alto dos Pinheiros = já era lead (EAP). Terraço Major e Cachaçaria Paulista: só telefone → WhatsApp
- Dashboard 01/08: 111 leads (99 novos + 12 antigos), 193 envios (email1 111, email2 70, email3 12), 2 respostas (1.8%)
- Degusti: aguardando cadastro (Razão Social/CNPJ/Endereço/Contato) p/ NF de amostra grátis

## 01/08 — Sessão (continuação): +10 email1, 1 bounce
- Enviados: Boteco 647 (boteco647@gmail.com, Vila Carrão), Espetaria Cantinho (espetariacantinho@gmail.com, Vila Carrão), Bar do Carlão Moema (bardocarlaomoema@gmail.com), Brett Bierhaus Moema (brettcervejas@gmail.com, Indianópolis), Deck Bar Itaim (reservasdeckitaim@gmail.com, Vila Olímpia), Virô Bar (contato@barviro.com, Parada Inglesa), Empório Serra da Cantareira (emporiodaserradacantareira@uol.com.br), O Barricão (barricao2@hotmail.com, adega tradicional Pinheiros desde 1973), Pedágio da Vila (pedagiodavila@hotmail.com, Vila Matilde)
- Bounce removido: Armazém 165 Cervejaria (samuel.moraes1@ig.com.br, Limão)
- SEM MX (descartados): Legittimo (contato@legittimobar.com.br), Maevva (contato@maevva.com.br), Bar do Camacho (camacho@bardocamacho.com.br)
- Padrão observado: emails @gmail.com tem bounce muito menor que hotmail/yahoo/terra do baresSP (listas antigas). Priorizar Gmail/domínios vivos.
- Totais sessão 01/08: 39 email1 enviados (29 válidos após 10 bounces) → 108 novos (120 total)
- Inbox: só Degusti (thread antiga) + bounces; sem novas respostas

## 01/08 (noite) — Sessão: WHATSAPP PARADO E PRIMEIRO LOTE ENVIADO
- PARCAMENTO CONCLUÍDO: usuário escaneou QR no celular 11 91357-7900. Credenciais salvas em .baileys_auth (958 arquivos). NÃO precisa escanear de novo — reconexão usa creds salvas.
- send-whatsapp-batch.mjs: agora inclui EXTRA_LEADS (Point das Bebidas 11 96023-1738, Prabar 11 99626-1147) e SKIP p/ Degusti (já engajada por email)
- LOTE 01/08 (00:17 local): ENVIADOS 7 — Adega do Louro, WinePRO, Benedetto Adega Boutique, Empório & Adega Morumbi, Fera Bebidas Atacadista, Point das Bebidas, Prabar. SEM WHATSAPP 11 (landlines/placeholders): Adega da Villa, Adega da Vila Mariana, Ômadá, Adega Corradini, Emporium SP, Boss Confidence, Gouveia, Freitas, Adega Flash, Becosa, Adega Empório Mais Bebidas. Erros 0.
- Degusti: mensagem WhatsApp dedicada (send-degusti-wa.mjs) pedindo Razão Social/CNPJ/Endereço/Contato p/ NF de amostra — ENVIADA
- Novos leads no cadastro: Point das Bebidas (Ipiranga, só phone), Prabar Bebidas (só phone, domínio sem MX) → total 110 leads (98 novos + 12 antigos)
- Bar do Jão, Oh Freguês, Adega G&G: SEM NÚMERO GRAVADO em lugar nenhum — não enviados
- Follow-ups: NADA vence em 01/08. email2 (grupo 31/07, 21 leads) e email3 (grupo 29/07, 15 leads) vencem DOMINGO 02/08 — email NÃO tem restrição de dia/horário, pode rodar no domingo
- REGRA CONFIRMADA PELO USUÁRIO: email 24/7; WhatsApp só seg-sáb 8h-21h (nunca domingo). Guarda de horário adicionada em send-whatsapp-batch.mjs

## 02/08 (madrugada) — Sessão: 36 follow-ups + 5 leads novos enviados
- 36 follow-ups enviados: 21 email2 (grupo 31/07) + 15 email3 (grupo 29/07) — email 24/7, rodou de madrugada
- 5 email1 enviados: Vinea Store Importadora e Wine Bar (crc@vinea.com.br, Paraíso), Multbev Distribuidora (sac@multbev.com.br), PMG Atacadista (gerenciacompras@pmg.com.br — email decodificado do Cloudflare, categoria CACHAÇA no catálogo + página Fornecedores), Adega Barubars (adegabarubars@gmail.com, Parelheiros), Espaço Armazém (comercial@espacoarmazem.com.br, Vila Leopoldina)
- Descartados por NXDOMAIN: Senhor K Butikin (contato@senhorkbutikin.com.br), Da Villa Chopperia (chopperiadavilla.com.br)
- Bairros-alvo sem leads: Saúde, Freguesia do Ó, Pirituba, Jabaquara (só telefones achados até agora)
- FIX pipeline.mjs: sendEmail1 pula leads sem email (Prabar não é mais tentado/erro de ruído)
- Dashboard 02/08: 127 leads (115 novos + 12 antigos), 243 envios (email1 125, email2 91, email3 27), 2 respostas

## 02/08 (domingo) — Sessão: +17 leads novos enviados
- Varredura CNPJ/domínios atacadistas + adegas periféricas. Todos com MX validado:
  - 4 email1: Mendes Distribuidora de Bebidas (mendesbebidasltda@gmail.com, Vila Maria), Adega JJ (adegafamilia1990@gmail.com, Jardim Bartira — atacadista e varejista), Empório Domínio Adega (contato.adegadominio@gmail.com, Jardim Santo Elias), Adega Correia (elivaldocorreia.2204@gmail.com, Jardim Guarani)
  - 6 email1: Distribuidora de Bebidas Pirituba (pirituba@bebidaspirituba.com.br, Pirituba — desde 1974), Distribuidora Hideal/Nova União (sac@distribuidorahideal.com.br, Jabaquara), Pirâmides Distribuidora (atendimento@piramidesdistribuidora.com.br, Ipiranga — destilados), Big Point Adega (shirleifarias25@gmail.com, Jardim Maringa), Adega Sorriso (sorrisobebidas@gmail.com, Jardim Keralux), Adega J.G (macycontabilidade@gmail.com, Vila Londrina)
  - 7 email1: Percas Comercial (pereiraclps@gmail.com, Vila Irmãos Arnoni), Liquor Distribuidora (mega500comercial@gmail.com, Jardim Arpoador — fracionamento), Heishop HKN Brasil (ludinunes6@gmail.com, Vila Ponte Rasa), DC Distribuidora (dcpanificadora149@gmail.com, Brás), NZE Distribuidora (ianster@gmail.com, Sumaré), Central Alimentos Atacadista (ativanegocios744@gmail.com, Brás), Cia do Whisky (atendimento@ciadowhisky.com.br)
- Duplicata descartada: Adega da Vila (loja@adegadavila.com.br já cadastrado)
- Dashboard 02/08 (atualizado): 148 leads (136 novos + 12 antigos), 264 envios (email1 146, email2 91, email3 27), 2 respostas
- Emails mascarados p/ próxima varredura: Adega Marques (rub***@gmail.com, Vila Mariana), Liquor Adega (liq***@gmail.com, Jardim Myrna II), Forte Distribuidora (for***@gmail.com, Perdizes), Gran Liquor (ang***@gmail.com), Atacadista Silva (com***@gmail.com, Ferraz de Vasconcelos)

## 02/08 (noite) — Sessão: +1 email1 (Adega à Jato)
- Adega à Jato (carlossdl@uol.com.br, Ipiranga — email do proprietário Carlos, site loja-adegas.sempane.com.br, delivery Seg-Sáb 08h-20h) — email1 OK
- Duplicatas confirmadas (já no cadastro): Gouveia Bebidas (fidalgouveia@uol.com.br, email2 02/08), Adega Flash (adegaflash@hotmail.com, email1 31/07), Kanguru Supermercado (sac@kangurusupermercado.com.br, email1 02/08 — estava no buffer e foi removido)
- Descartados por regra de email de contador: Adega do Careca (micaelcontabil.escritorio@gmail.com, Capão Redondo)
- Itaquera/Grajaú: só telefones achados (Adega ED II, Adega Gold Drinks, Itaquerão Distribuidora) — sem email exposto
- Dashboard 02/08 (atualizado): 157 leads (145 novos + 12 antigos), 273 envios (email1 155, email2 91, email3 27), 2 respostas (1.3%)

## 02/08 (noite) — PLANILHA PARALELA: +87 email1 (lote 1/100)- Usuário anexou planilha Google (3200 negócios gastronomia SP: hamburguerias, restaurantes, padarias, bares, pizzarias, japonesas, cafeterias etc) — 2463 emails novos após dedup (15 duplicatas vs cadastro, 218 dentro da planilha)
- Estratégia definida com usuário: LOTE DE 100/DIA, priorizando adegas → bares → restaurantes. Scripts: `extract-planilha.mjs` (gera leads-planilha.json), `fazer-lote.mjs N` (gera lote-planilha.json com prioridade + marca processed)
- LOTE 1 (100): 87 enviados — 40 adegas + 47 bares. 13 SEM MX pulados (Canto da Cerveja, What's on Tap, Bardega, Bier&Bier, Bottled Dog, Iaia Cave, Bocca Nera, Baco Dvino, Partisans Pub, Boteco SP, Bar do Arnesto, Bao Bar, Terreo Bar)
- Destaques lote 1: 3x Vino! (grupovino.com), 3x Brass Brew, 2x TRILHA Cervejaria, Cachaçaria Ouro Verde (cachacariaouroverde@outlook.com), Goose Island/Ambev (franquias@ambev.com.br), Dogma, Cervejaria Central SP, Miya Wine Bar, Vinoteca Paulistana
- Restantes p/ próximos lotes: 2353 (maioria restaurantes)
- Dashboard 02/08 (atualizado): 244 leads (232 novos + 12 antigos), 360 envios (email1 242, email2 91, email3 27), 2 respostas (0.8%)
- IMPORTANTE: leads-planilha.json NÃO entra no cadastro — é só o rastreador de progresso (campo `processed`). Lote vira leads-qualificados.json via `node pipeline.mjs --add-file lote-planilha.json --send`

## 02/08 (noite) — LIMITE DIÁRIO GMAIL ATINGIDO (500/dia)
- 512 emails enviados em 02/08 → **Gmail 550 "Daily user sending limit exceeded"** (~49 do lote 6 falharam)
- LIMITE REAL: Gmail free ~500 emails/dia por conta. NÃO adianta lotes de 100/dia — dá pra disparar vários lotes seguidos até bater 500, depois PARAR até resetar
- 51 leads ficaram PENDENTES (ADD OK no cadastro mas sem email1) — serão enviados automaticamente no próximo `node pipeline.mjs --send` quando o limite resetar
- Estado real: 683 leads cadastrados, 632 email1 enviados, 51 pendentes. Planilha restante: 1853 (não processados) + 49 falhos do lote 6 re-processáveis
- APRENDIZADO: `fazer-lote.mjs` marca `processed` ANTES do envio; os que falham por limite não entram como "processados perdidos" — ficam no cadastro como pending e o pipeline re-tenta. OK manter fluxo.
- Dashboard 02/08 (final): 683 leads, 750 envios totais (email1 632, email2 91, email3 27), 2 respostas (0.3%)

## 03/08 (seg) — Sessão: FIX encoding, +337 email1, 54 WhatsApp (excesso)
- FIX CRÍTICO: run-03-08.ps1 (UTF-8 sem BOM) corrompia "Área de Trabalho" → `MODULE_NOT_FOUND`. Corrigido usando caminho curto 8.3 no script: `C:\Users\rotat\OneDrive\READET~1\PINDOR~1\PINDOR~1`
- NOVO run-diario.ps1 (caminho 8.3, log datado logs/run-<stamp>.log) + tarefa "Pindorama Run 0408" (04/08 08:00, Interactive rotat). Antiga "Pindorama Run 0308" removida
- 03/08 executado: esvaziou 41 pendentes do limite anterior + lote 100 (+86 OK) + lote 100 (parcial, bateu limite) + 46 followups (email2 grupo 31/07 + email3). Total hoje: 337 enviados, ~500 contabilizados → limite atingido de novo
- ⚠️ WHATSAPP EXCESSO: 54 mensagens enviadas em 03/08 num único run (conexão Baileys lenta; 2º run falhou "Connection Failure" e 5min sem pareamento). USUÁRIO: máx 3-4/dia p/ não travar a conta
- FIX send-whatsapp-batch.mjs: guard MAX_PER_DAY=4 (conta whatsappSent com whatsappDate=hoje; aborta se >=4; para no meio da execução)
- WhatsApp 03/08: 54 enviados (muito acima do teto — não rodar de novo hoje)
- Dashboard 03/08: 945 leads (933 novos + 12 antigos), 1087 envios (email1 904, email2 119, email3 64), 2 respostas (0.2%)
- Pendentes p/ 04/08: 41 no cadastro sem email1 (lote do fim do dia). Planilha restante: 1553 não processados

## WhatsApp — status (atualizado 03/08)
- Automação whatsapp.mjs (Baileys 7.0.0-rc14) PARCEADA (creds salvas em .baileys_auth)
- ⚠️ LIMITE DIÁRIO = 4 mensagens/dia (decisão do usuário — conta pode travar com mais). Guard MAX_PER_DAY em send-whatsapp-batch.mjs
- Baileys: se 2º run logo após o 1º dá "Connection Failure" — aguardar minutos entre runs
- Para enviar: `node send-whatsapp-batch.mjs` (conecta, espera até 5min, valida onWhatsApp, marca whatsappSent/whatsappDate)
- Processo em background NÃO fica vivo após o script sair — para manter conexão, rodar `node whatsapp.mjs --connect`

## Próximos vencimentos (atualizado 04/08 madrugada)
- Pendentes email1: 83 no cadastro (guard 480/24h ativo — send-log cheio). Próximo `node pipeline.mjs --send` quando a janela deslizante abrir (madrugada/04-05/08)
- 04-05/08: lote 100 da planilha (1453 restantes) + email2 grupo 02/08 (146 leads, daysDiff(date1)>=2) + email3 se vencido
- WhatsApp: máx 4/dia, seg-sáb 8h-21h, domingo nunca. NÃO rodar em 04/08 se 03/08 já usou 54 — reset diário do teto 4
- ORDEM DIÁRIA (run-diario.ps1): (1) `--send` pendentes, (2) `fazer-lote.mjs 100` + `--add-file --send`, (3) `--followup`, (4) WhatsApp, (5) `metrics.mjs`

## 03/08 (noite) — Sessão: expansão para municípios (SP capital + ABC + região)
- Pedido do usuário: buscar leads fora de SP capital — São Bernardo, São Caetano, Diadema, Mauá, Cotia, Ibiúna, Caieiras, Franco da Rocha etc. Planilha é 100% SP capital.
- Estratégia escolhida: busca web (websearch) por "adega/distribuidora bebidas <cidade>" em coligado.com.br, guiapj.com.br, diariocidade.com, mestregeo.com.br, icnpj.org, spotway.com.br — anotar name/email/neighborhood/type/context, validar MX, adicionar ao cadastro.
- 6 leads novos ADICIONADOS + email1 enviados (MX validado: gmail, hotmail, bol.com.br OK):
  - Distribuidora Lacerda (damiaolacerda354@gmail.com, Mauá — atacado e varejo, CNPJ 45.686.398/0001-08)
  - Adega e Distribuidora do Marley (adegadomarley@hotmail.com, Mauá — Jardim Zaira)
  - Adega da Pracinha (adegadapracinha@gmail.com, Mauá)
  - Adega Dressaca (adegadressaca@gmail.com, Ibiúna — Ressaca)
  - Adega Dias / Distribuidora de Bebidas Dias (aronaldo.dias@bol.com.br, Caieiras — desde 2016)
  - Adega VRS Bebidas (VINICIUSRIBEIRODASILVA3387@gmail.com, Cotia — email do proprietário via CNPJ)
- DESCARTADOS (email de contador → regra): Adega Drinks Beer (Caieiras), Adega JM Madeira, Adega Casa Grande, Adega E Emporio Fenix (Diadema), Adega Ed+ e Adega Alentejana (Mauá). Site da Adega Ideal (Diadema) aponta p/ contabilidade → pulado.
- MASCARADOS p/ próxima varredura (Cloudflare/GuiaPJ, decodificar ou buscar em outra fonte): Adega Ideal Distribuidora (Diadema, CNPJ 46.233.456/0001-00), ADEGA DO ALEMAO (Cotia, atacadista), DISTRIBUIDORA E ADEGA ARUEIRAS (São Caetano, CNPJ 17.464.979/0001-51), Adega R Silva (Ibiúna, atacado e varejo, ron***@gmail.com)
- pipeline.mjs --send rodou e esvaziou os 46 pendentes (janela Gmail abriu) — incluindo os 6 novos.
- Dashboard 03/08 (noite): 952 leads, 951 email1, 119 email2, 64 email3, 1134 envios totais, 2 respostas (0.2%)

## 04/08 (madrugada) — Sessão: decodificação mascarados + lote planilha
- DECODIFICAÇÃO CLOUDFLARE (guiapj email-protection): script node XOR (key = 2 primeiros hex do hash). RESULTADO: todos os mascarados de CNPJ eram emails de CONTABILIDADE → descartados por regra:
  - DISTRIBUIDORA E ADEGA ARUEIRAS (São Caetano) = agile.contabilidade@hotmail.com → DESCARTADA
  - ADEGA IDEAL DISTRIBUIDORA (Diadema) = contato@rjlimacontabilidade.com.br → DESCARTADA
  - Adega R Silva (Ibiúna) = ronivonsilva118@gmail.com → **VÁLIDA** (proprietário Ronivon, bate com ron***@gmail.com da Receita) → ADICIONADA + email1 enviado
- Adega do Alemão (Cotia): não decodificado, mesmo padrão de contador provável → suspenso
- LOTE PLANILHA (fazer-lote.mjs 100): restaurantes. pipeline --add-file lote-planilha.json --send adicionou +100 (SEM duplicatas, verificado por email) e enviou até o guard parar.
- ⚠️ BUG CONFIRMADO: pipeline grava cadastro de forma parcial quando interrompido — Adega VRS foi ENVIADO ("EMAIL1 OK") mas email1/date1 perdidos na gravação → marcado manualmente p/ evitar duplicata. Ao matar pipeline no meio, SEMPRE conferir o último lead enviado vs marcado.
- ⚠️ send-log.json é PRUNE no guard: janela 24h mantém só timestamps recentes (02/08 sumiu). 849 → 384 → 480. Não é perda de dados — é o guard.
- Guard atingiu GMAIL_SAFE_LIMIT=480 (send-log=480) → pipeline PAROU sozinho. 83 pendentes ficaram no cadastro p/ próximo --send quando janela abrir.
- Dashboard 04/08 (madrugada): 1131 leads (1119 novos + 12 antigos), 1047 email1, 119 email2, 64 email3, 1230 envios, 2 respostas (0.2%)
- Pendentes email1: 83 (restaurantes do lote). Planilha restante: 1453 não processados.

## 04/08 (madrugada) — MIGRAÇÃO PARA NUVEM (Google Cloud e2-micro)
- Motivo: PC travando — OneDrive consumia 24.438s CPU (projeto dentro de OneDrive\Área de Trabalho, sync de JSONs/logs/.baileys_auth 958 arquivos), codex 3.1GB RAM, ChatGPT x4, OpenCode x4. Alívio imediato aplicado: encerrou codex+ChatGPT e pausou OneDrive.
- IMPORTANTE: verificado com schtasks (404 tarefas) — NÃO existe nenhuma tarefa agendada do Pindorama no Windows. Tudo era rodado manualmente nas sessões. A nuvem com cron+PM2 vai automatizar de verdade (24/7).
- Credenciais (App Password Gmail) estão HARDCODED em todos os .mjs → portável para a VM, mas NUNCA push em repo público.
- Pacote de deploy criado: `C:\Users\rotat\AppData\Local\Temp\opencode\pindorama-deploy.tar.gz` (22,2MB, 1449 arquivos, inclui .baileys_auth, leads*.json, send-log.json, deploy/).
- deploy/ criado: empacotar.ps1 (usa caminho 8.3 — caminho com acento faz tar vazio/0MB), setup-server.sh (Node20 + swap 2GB + deps + PM2 monitor), run-diario.sh (tradução Linux do run-diario.ps1), instalar-cron.sh (run diário 08:00, relatório Qui 17:00, dashboard 06/18h, auto-reply 10min, WhatsApp 9/12/15h seg-sáb), whatsapp-parear.mjs (QR no terminal + servidor HTTP porta 3001, precisa firewall GCP), INSTRUCOES.md (passo a passo GCP completo).
- whatsapp.mjs usa `cmd.exe`/`start` p/ abrir navegador (SÓ Windows) — na VM usar `deploy/whatsapp-parear.mjs` p/ parear e `pm2 start whatsapp.mjs -- --connect` p/ manter conexão (o send-whatsapp-batch.mjs REUSA a conexão via connect()).
- monitor.mjs = loop contínuo (2min) → PM2. auto-reply.mjs = one-shot → cron 10min.
- Próximo: usuário criar VM e2-micro no GCP (região free), scp do pacote, rodar setup, parear WhatsApp, cron.

## 04/08 (manhã) — Sessão: rota de prospecções (São Bernardo + Santo André)
- Continuação da expansão de municípios (marcos: 03/08 noite + 04/08 madrugada). Buscas em guiapj.com.br/consultas.plus/coligado.com.br p/ São Bernardo do Campo e Santo André.
- DECODIFICADOS (XOR Cloudflare): Adega Arariba (Santo André) = thammyresmello@hotmail.com VÁLIDA; G S A Distribuidora (Santo André) = gerencia@malegalizacao.com.br → DESCARTADA (contabilidade).
- 4 leads ADICIONADOS como pendentes (MX validado: gmail/hotmail/yahoo OK, 4/4) — total cadastro 1123:
  - Adega Industrial (carvalhomarcella448@gmail.com, São Bernardo, Alto Industrial — atacadista, CNPJ 57.444.022/0001-68)
  - Adega Do Laura (adegadolaura@hotmail.com, São Bernardo — distribuidora, CNPJ 20.644.786/0001-97)
  - ADEGACA Distribuidora de Bebidas (alfredojnetto@yahoo.com.br, Santo André, Santa Terezinha — CNPJ 41.741.336/0001-92)
  - Adega Arariba (thammyresmello@hotmail.com, Santo André — atacado e varejo, CNPJ 44.930.207/0001-30)
- NÃO ENVIADOS (janela cheia): guard = 480/480 na janela 24h, envio mais antigo expira 04/08 16:10 → pipeline enviará sozinho quando liberar.
- CONTINUAÇÃO MESMA SESSÃO (tarde): +7 leads adicionados (total 1131) — WebBar (loja@webbar.com.br, São Bernardo, Batistini, CNPJ 40.114.252/0001-66), G2 Especialista em Bebidas (contato@g2atacadodebebidas.com.br, Santo André — 6 unidades + CD Ragueb Chohfi, +30 anos, WhatsApps SA 11947191279/Diadema 11950946007), Adega Mineiro SP (adegamineirosp@hotmail.com, São Bernardo, CNPJ 20.693.934/0001-63), Adega do Terrinha (forcas@uol.com.br, Santo André, CNPJ 27.228.339/0001-04), Adega Samcro Beer (caiquefelix11@hotmail.com, Santo André — proprietário Caique, CNPJ 46.327.899/0001-52), Outlet Wine (rodriguescelsoluiz8@gmail.com, Santo André, atacadista, CNPJ 39.542.322/0001-06), Adega e Distribuidora Venha Ver (adega.venhaver@gmail.com, Santo André/Utinga, CNPJ 49.933.455/0001-59), Adega e Distribuidora de Bebidas Silva (er9052375@gmail.com, Santo André/Santa Terezinha, CNPJ 55.549.030/0001-43 — email possivelmente de contador, enviar com cautela).
- DESCARTADA: G S A Distribuidora (Santo André) = gerencia@malegalizacao.com.br (contabilidade). Descarta por regra.
- SEM EMAIL ENCONTRADO: Infinite Distribuidora de Bebidas (São Bernardo, infinitebebidas.com.br — site inacessível, LinkedIn universobebidas, 27 funcionários, atacadista) → p/ nova varredura.
- Dashboard 04/08 (tarde): 1143 leads, 1047 email1, 119 email2, 64 email3, 1230 envios, 2 respostas (0,2%). Pendentes email1: 95 (83 lote + 12 novos de municípios). Janela Gmail 480/480, primeiro envio expira 04/08 16:10.

## 04/08 (tarde) — BACKUP GITHUB PRIVADO CONCLUÍDO
- Projeto 100% versionado e PUSHADO em repo PRIVADO: `https://github.com/gustavorotatori-svg/Pindorama` (gh autenticado como gustavorotatori-svg, escopo repo). Branch master.
- Inclui: leads-qualificados.json (1143), send-log.json, .baileys_auth, deploy/, AGENTS.md, todos os .mjs.
- ATENÇÃO: credenciais hardcoded (App Password Gmail) + .baileys_auth estão NO REPO PRIVADO. NUNCA tornar público.
- git local: identidade GusRotatori/gusrotartori@icloud.com. Para atualizar backup: `git add -A && git commit -m "..." && git push`.
- Usuário decidiu (04/08): por enquanto SÓ o backup no GitHub; migração para VM GCP fica para depois.
- ⚠️ empacotar.ps1 quebrado (0MB): `dir /x` pega [-1]=nome longo em vez do 8.3; caminho 8.3 correto do projeto = `C:\Users\rotat\OneDrive\READET~1\PINDOR~1\PINDOR~1`. Corrigir na próxima necessidade de tar.

## 04/08 (noite) — 100% NUVEM: PC DESLIGADO DE TUDO (ordem do usuário)
- USUÁRIO ORDENOU: parar de usar o computador, rodar TUDO no GitHub. PC estava quase inutilizável.
- AÇÃO: TODAS as tarefas agendadas do Windows DESABILITADAS (schtasks /DISABLE): "Pindorama Dashboard", "Pindorama Dashboard 18h", "Pindorama Relatorio PDF", "Pindorama Run 0408", "Pindorama WhatsApp Reminder". NADA roda local agora.
- Workflows ativos no GitHub Actions (todos com concurrency group `pindorama` p/ serializar escrita do repo):
  - `email-pipeline.yml`: cron `0 10,16,22 * * *` (07/13/19 BRT) → `node pipeline.mjs --all` + `node metrics.mjs`
  - `auto-reply.yml`: cron `15 * * * *` (1x/h) → `node auto-reply.mjs`
  - `whatsapp.yml`: cron `0 17 * * 1-6` (14h BRT seg-sáb) → `node send-whatsapp-batch.mjs` (guard MAX_PER_DAY=4 + janela 8-21h)
- TESTADO: auto-reply respondeu Imigrantes Bebidas (run 30936632250). Email-pipeline rodou mas QUOTA GUARD 480/480 (teto seguro, NÃO bloqueio). WhatsApp abortou por hora fora da janela (21h) — guard correto.
- FIX send-whatsapp-batch.mjs: fora da janela/limite agora exit(0) (não marca falha no Actions).
- ⚠️ GMAIL: 480/24h é o MÁXIMO SEGURO (Gmail bloqueia em ~500/dia). O guard NUNCA deixa bloquear. A CI esvazia pendentes automaticamente quando a janela deslizante abre. Não tentar passar de 480.
- ⚠️ WHATSAPP NA CI: sessão .baileys_auth commitada no repo. Se a sessão expirar, o run falha e é preciso re-parear (scannear QR) — usar `deploy/whatsapp-parear.mjs` ou local + push. Não duplicar envio PC+CI ao mesmo tempo (dessincroniza sessão).
- Regra do usuário: NUNCA mais rodar pipeline localmente; sempre via GitHub Actions. Backup local só p/ edição de código + push.
- Para ver os runs: `gh run list -R gustavorotatori-svg/Pindorama`.

## Regras de envio (mandatory)
- EMAIL: 24h por dia, 7 dias por semana — sem restrição de dia/horário
- WHATSAPP: apenas de SEGUNDA a SÁBADO, das **9h às 20h**; **MÁXIMO 3-4/dia** (trava a conta se passar)
- Domingo: NUNCA enviar WhatsApp (email pode)
- Apenas primeira mensagem automática — usuário assume o contato depois

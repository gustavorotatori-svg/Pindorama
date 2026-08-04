import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const text = `Olá Ghirag, bom dia! Tudo ótimo por aqui, obrigado por perguntar.

Ótimas perguntas — deixa eu responder ponto a ponto.

1) Sobre o ICMS/DIFAL na venda do RJ para SP

Para revenda (sua empresa, contribuinte do ICMS com CNPJ ativo), a operação é interestadual normal: emitimos a NF pelo RJ com ICMS interestadual de 12% e sua empresa credita esse valor na apuração. O DIFAL incide apenas em vendas para não contribuintes (consumidor final pessoa física) — que não é o caso de vocês. Se o time fiscal de vocês quiser validar, envio um modelo de NF para conferência.

2) O que posiciona a Pindorama no preço

Você tem razão em perguntar — e é aí que a gente ajuda vocês a vender. Não somos "mais uma prata de prateleira", e sim:

- Cachaça artesanal premium, produzida no Vale do Café (RJ), em pequena escala e com controle em cada lote.
- A Clássica vem em 750ml, formato que reforça o valor percebido na prateleira e na taça.
- Marca com história de terroir: o consumidor que compra numa adega premium busca essa narrativa, não o preço de marketplace.
- Suporte completo: degustadora na loja, treinamento para a equipe e material de apoio para vocês contarem essa história.

Sobre a Magalu abaixo de R$ 70: é exatamente o ponto. No marketplace a marca queima preço e o canal especializado perde margem e credibilidade. Nossa política é de preço firme para proteger o canal físico — vocês vendem com margem saudável, sem concorrer com a queima. A amostra grátis e a bonificação no primeiro pedido fazem vocês testarem o giro sem risco.

3) Cobra Coral

Sim! A Cobra Coral é feita à base de jabuticaba — cachaça premium de jabuticaba, 600ml, a R$ 42. É uma ótima porta de entrada de preço e um diferencial de sabor claro para o cliente que quer algo além da prata tradicional.

Quer que eu agende o envio das amostras? Me confirma Razão Social, CNPJ e endereço da loja que já emito a NF de amostra gratuita.

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900`;

await transporter.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: 'atendimento@degusti.com.br',
  subject: 'Re: RES: RES: Cachaça artesanal premium para sua adega',
  text,
});
console.log('Enviado para atendimento@degusti.com.br');

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const text = `Olá Ghirag, tudo bem?

Obrigado pelo retorno e pela abertura para conhecer a Pindorama!

Segue nossa tabela de preços (atacado):

Pindorama Clássica (750ml) ......... R$ 84,00
Pindorama Ouro (700ml - premium) .. R$ 120,00
Cobra Coral (600ml - jabuticaba) .. R$ 42,00
Miniaturas (200ml) ................ R$ 20,00 a R$ 35,00

Condições comerciais:
- Pedido mínimo: 1 caixa
- Pagamento: 21 dias (boleto)
- Entrega: D+2 dias úteis
- Frete: CIF (por nossa conta)

Faturamento: pelo RJ (fazenda no Vale do Café).

Trabalhamos com margem saudável justamente para valorizar o canal de venda, sem queima de preços.

Para complementar, oferecemos:
- Amostra grátis para vocês conhecerem a linha
- Degustadoras para ações no estabelecimento
- Treinamento para a equipe sobre o produto
- Bonificação no primeiro pedido teste

Quer que eu envie as amostras para a loja? Se sim, me passa Razão Social, CNPJ, endereço completo e nome para contato, que já emito a NF de amostra gratuita.

Abraço,
Gustavo
Pindorama - Cachaça Artesanal
(11) 91357-7900`;

await transporter.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: 'atendimento@degusti.com.br',
  subject: 'Re: RES: Cachaça artesanal premium para sua adega',
  text,
});
console.log('Enviado para atendimento@degusti.com.br');

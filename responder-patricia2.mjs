import nodemailer from 'nodemailer';

const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'cachaca011pindorama@gmail.com', pass: 'wnau jrrr rjpc zuuv' },
});

const body = `Olá Patricia, muito obrigado pelo retorno!

Sexta-feira 31/07 está perfeito. Vou providenciar a entrega.

Para emitirmos a Nota Fiscal de Amostra Grátis, preciso dos dados abaixo:

- Razão Social
- CNPJ
- Endereço completo (com CEP)
- Contato (nome e telefone)

Assim que receber, programo a entrega para sexta sem falta.

Qualquer dúvida, estou à disposição.

Abs,
Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900`;

try {
  await t.sendMail({
    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
    to: 'patricia@mirogastronomia.com.br',
    subject: 'Re: Miró Gastronomia — cachaça artesanal',
    text: body,
  });
  console.log('✅ Resposta enviada para Patricia');
} catch(e) {
  console.error('❌ Erro: ' + e.message);
}

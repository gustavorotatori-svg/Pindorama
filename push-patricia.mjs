import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const r = await t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: 'patricia@mirogastronomia.com.br',
  subject: 'Re: Mir\u00f3 Gastronomia \u2014 cacha\u00e7a artesanal [URGENTE]',
  text: 'Ol\u00e1 Patricia,\n\nTudo bem? Tentei te responder mas os dados do cadastro n\u00e3o chegaram completos.\n\nPreciso dos dados abaixo at\u00e9 amanh\u00e3 (30/07) \u00e0s 12h para garantir a entrega na sexta 31/07:\n\n\u2022 Raz\u00e3o Social\n\u2022 CNPJ\n\u2022 Endere\u00e7o completo com CEP\n\u2022 Contato (nome e telefone)\n\nSe preferir, pode me ligar ou mandar WhatsApp no (11) 91357-7900 que resolvo rapidinho.\n\nCaso n\u00e3o receba retorno at\u00e9 amanh\u00e3 ao meio-dia, vou ligar l\u00e1 no restaurante para falar com voc\u00ea ou com o gerente.\n\nN\u00e3o quero perder a oportunidade de voc\u00eas conhecerem a Pindorama sexta!\n\nAbs,\nGustavo\n(11) 91357-7900'
});
console.log('OK ' + r.messageId);

import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({service:'gmail',auth:{user:'cachaca011pindorama@gmail.com',pass:'wnau jrrr rjpc zuuv'}});
const r = await t.sendMail({
  from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
  to: 'patricia@mirogastronomia.com.br',
  subject: 'Re: Miró Gastronomia — cachaça artesanal',
  text: 'Olá Patricia,\n\nObrigado por enviar! Pelo que recebi aqui, os dados do cadastro ficaram em branco \u2014 pode ser que o arquivo ou as informações não tenham sido anexados corretamente.\n\nVocê pode reenviar os dados abaixo?\n\n\u2022 Razão Social\n\u2022 CNPJ\n\u2022 Endereço completo (com CEP)\n\u2022 Contato (nome e telefone)\n\nAssim que receber, já programo a entrega para sexta-feira 31/07 sem falta.\n\nAbraço,\nGustavo\nPindorama \u2014 Cachaça Artesanal\n(11) 91357-7900 \u00b7 cachaca011pindorama@gmail.com'
});
console.log('OK ' + r.messageId);

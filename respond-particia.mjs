import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cachaca011pindorama@gmail.com',
    pass: 'wnau jrrr rjpc zuuv',
  },
});

async function respond() {
  await transporter.sendMail({
    from: '"Gustavo - Pindorama" <cachaca011pindorama@gmail.com>',
    to: 'patricia@mirogastronomia.com.br',
    subject: 'Re: Miró Gastronomia — cachaça artesanal',
    text: `Oi Patricia,

Que bom que recebeu! Fico feliz.

Quando tiver um tempinho, posso levar uma amostra para vocês experimentarem pessoalmente. Sem compromisso.

Qual o melhor dia e horário?

Abraço,
Gustavo
Pindorama — Cachaça Artesanal
(11) 91357-7900
drinkpindorama.com`,
    html: `<div style="font-family: Arial, sans-serif; font-size: 14px;">
<p>Oi Patricia,</p>
<p>Que bom que recebeu! Fico feliz.</p>
<p>Quando tiver um tempinho, posso levar uma <strong>amostra</strong> para vocês experimentarem pessoalmente. Sem compromisso.</p>
<p>Qual o melhor dia e horário?</p>
<div style="margin-top:25px;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#555;">
<p style="margin:0;"><strong>Gustavo</strong></p>
<p style="margin:3px 0;">Pindorama — Cachaça Artesanal</p>
<p style="margin:3px 0;">(11) 91357-7900 · drinkpindorama.com</p>
</div>
</div>`,
  });
  console.log('✅ Resposta enviada para Patricia!');
}

respond().catch(e => console.error('❌', e.message));

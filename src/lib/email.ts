import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail({ to, subject, html, attachments }: EmailParams) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: 'Pindorama Prospecção <cachaca011pindorama@gmail.com>',
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? Buffer.from(att.content, 'base64') : att.content,
      })),
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error };
  }
}

const EMAIL_SIGNATURE = `
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
  <p style="margin: 0;">
    <strong>Gustavo</strong><br>
    Pindorama - Cachaça Artesanal<br>
    📧 <a href="mailto:cachaca011pindorama@gmail.com">cachaca011pindorama@gmail.com</a><br>
    📞 (11) 91357-7900<br>
    🌐 <a href="https://drinkpindorama.com">drinkpindorama.com</a>
  </p>
</div>
`;

export function getEmail1Content(prospectName: string, contactName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Olá ${contactName},</p>
      
      <p>Oi, sou Gustavo da <strong>Pindorama</strong>, uma cachaça artesanal produzida na Fazenda das Palmas, no Vale do Café, Rio de Janeiro.</p>
      
      <p>Nossa cachaça é única porque nossos canaviais orgânicos são cercados por quase 200 hectares de Mata Atlântica, dentro de uma zona de proteção permanente.</p>
      
      <p>Temos parcerias com hotéis, bares e restaurantes sofisticados como Fasano, Hilton, Rosewood e Emiliano.</p>
      
      <p>Gostaria de oferecer uma <strong>amostra gratuita</strong> da nossa linha para que vocês conheçam a qualidade Pindorama.</p>
      
      <p>Para envio das amostras, preciso dos seguintes dados cadastrais:</p>
      <ul>
        <li>Razão Social</li>
        <li>CNPJ</li>
        <li>Endereço completo</li>
        <li>Nome para contato</li>
      </ul>
      
      <p>Posso enviar as amostras?</p>
      
      <p>Em anexo segue nossa apresentação institucional.</p>
      
      ${EMAIL_SIGNATURE}
    </div>
  `;
}

export function getEmail2Content(contactName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Olá ${contactName},</p>
      
      <p>Espero que esteja bem! Enviei informações sobre amostra gratuita da Pindorama há alguns dias.</p>
      
      <p>Nossa cachaça já é servida em estabelecimentos como Arpoador Inn, Arp Bar, e em parcerias com marcas como FarmRio e Amarello.</p>
      
      <p>Gostaria de saber se há interesse em receber as amostras?</p>
      
      <p>Em anexo nossa apresentação para consulta.</p>
      
      ${EMAIL_SIGNATURE}
    </div>
  `;
}

export function getEmail3Content(contactName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Olá ${contactName},</p>
      
      <p>Não obtive retorno, mas queria reforçar que temos <strong>amostras gratuitas</strong> disponíveis.</p>
      
      <p>Caso não tenha interesse, sem problemas!</p>
      
      <p>Em anexo nossa apresentação para consulta.</p>
      
      ${EMAIL_SIGNATURE}
    </div>
  `;
}

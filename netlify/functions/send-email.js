const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, message, sendResume } = body;

  if (!name || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  const attachments = [];
  if (sendResume) {
    const pdfPath = path.join(__dirname, '../../assets/CV-Marta-Gracia.pdf');
    const pdfContent = fs.readFileSync(pdfPath);
    attachments.push({
      filename: 'CV-Marta-Gracia.pdf',
      content: pdfContent.toString('base64'),
    });
  }

  try {
    await resend.emails.send({
      from: 'Marta Gracia Portfolio <onboarding@resend.dev>',
      to: 'martagraib@gmail.com',
      replyTo: email,
      subject: `Portfolio contact: ${name}${sendResume ? ' — Resume requested' : ''}`,
      html: `
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        ${sendResume ? '<p><em>CV attached as requested.</em></p>' : ''}
      `,
      attachments,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('Resend error:', JSON.stringify(err));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to send email' }),
    };
  }
};

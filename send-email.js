const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const data = JSON.parse(event.body);
    const { to, subject, body } = data;

    if (!to || !subject) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kspider221206@gmail.com',
        pass: 'znulzrotkvwnmjfw'
      }
    });

    await transporter.sendMail({
      from: '"K Spider AI" <kspider221206@gmail.com>',
      to: to,
      subject: subject,
      text: body || subject,
      html: (body || subject).replace(/\n/g, '<br>')
    });

    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };

  } catch (err) {
    console.error('Email error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

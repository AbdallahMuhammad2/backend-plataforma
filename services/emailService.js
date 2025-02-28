const nodemailer = require('nodemailer');
const { stringUtils } = require('../utils/helpers');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"EscritaMaster" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  // Email templates
  async sendWelcomeEmail(user) {
    const subject = 'Bem-vindo ao Curso de redação!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Olá, ${stringUtils.sanitizeHtml(user.name)}!</h1>
        <p>Seja bem-vindo(a) à EscritaMaster! Estamos muito felizes em ter você conosco.</p>
        <p>Aqui você encontrará:</p>
        <ul>
          <li>Cursos de redação</li>
          <li>Correções personalizadas</li>
          <li>Comunidade de estudantes</li>
          <li>Material exclusivo</li>
        </ul>
        <p>Para começar, acesse nossa plataforma e explore os cursos disponíveis.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" 
             style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Acessar Plataforma
          </a>
        </div>
        <p>Se precisar de ajuda, não hesite em nos contatar.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendSubmissionReceivedEmail(user, submission) {
    const subject = 'Redação Recebida com Sucesso';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Redação Recebida!</h1>
        <p>Olá, ${stringUtils.sanitizeHtml(user.name)}!</p>
        <p>Sua redação "${stringUtils.sanitizeHtml(submission.title)}" foi recebida com sucesso.</p>
        <p>Detalhes da submissão:</p>
        <ul>
          <li>Data: ${new Date(submission.created_at).toLocaleDateString()}</li>
          <li>Status: Aguardando correção</li>
        </ul>
        <p>Você receberá um email assim que sua redação for corrigida.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/submissions/${submission.id}" 
             style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Ver Submissão
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendCorrectionCompletedEmail(user, submission) {
    const subject = 'Sua Redação Foi Corrigida!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Correção Concluída!</h1>
        <p>Olá, ${stringUtils.sanitizeHtml(user.name)}!</p>
        <p>A correção da sua redação "${stringUtils.sanitizeHtml(submission.title)}" foi concluída.</p>
        <p>Detalhes da correção:</p>
        <ul>
          <li>Nota: ${submission.score}</li>
          <li>Data da correção: ${new Date(submission.updated_at).toLocaleDateString()}</li>
        </ul>
        <p>Acesse a plataforma para ver o feedback completo e as sugestões de melhoria.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/submissions/${submission.id}" 
             style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Ver Correção
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Recuperação de Senha';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Recuperação de Senha</h1>
        <p>Olá, ${stringUtils.sanitizeHtml(user.name)}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
             style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Redefinir Senha
          </a>
        </div>
        <p>Se você não solicitou a redefinição de senha, ignore este email.</p>
        <p>Este link expira em 1 hora.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();

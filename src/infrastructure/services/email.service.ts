import nodemailer from 'nodemailer';
import { logger } from '../logging/winston-logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS
      }
    });
  }

  async sendInvitationEmail(
    email: string, 
    tempPassword: string, 
    invitationToken: string,
    inviterName: string
  ): Promise<boolean> {
    try {
      const invitationUrl = `${process.env.FRONTEND_URL}/auth/complete-registration?token=${invitationToken}`;
      
      const html = this.generateInvitationTemplate(
        email,
        tempPassword,
        invitationUrl,
        inviterName
      );

      const mailOptions: EmailOptions = {
        to: email,
        subject: '🚢 Invitación a CorpoTurismo - Completa tu registro',
        html,
        text: `Has sido invitado a CorpoTurismo. Visita: ${invitationUrl} y usa la contraseña temporal: ${tempPassword}`
      };

      await this.sendEmail(mailOptions);
      
      logger.info(`✅ Email de invitación enviado a: ${email}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error enviando email de invitación a ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const html = this.generateWelcomeTemplate(userName);

      const mailOptions: EmailOptions = {
        to: email,
        subject: '🎉 ¡Bienvenido a CorpoTurismo!',
        html,
        text: `¡Bienvenido ${userName}! Tu cuenta ha sido activada exitosamente.`
      };

      await this.sendEmail(mailOptions);
      
      logger.info(`✅ Email de bienvenida enviado a: ${email}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error enviando email de bienvenida a ${email}:`, error);
      return false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `"CorpoTurismo" <${process.env.FROM_EMAIL || 'noreply@corpoturismo.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateInvitationTemplate(
    email: string,
    tempPassword: string,
    invitationUrl: string,
    inviterName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitación a CorpoTurismo</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f8f9fa; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚢 CorpoTurismo</h1>
            <p>Sistema de Gestión de Turnos</p>
          </div>
          
          <div class="content">
            <h2>¡Has sido invitado!</h2>
            <p>Hola,</p>
            <p><strong>${inviterName}</strong> te ha invitado a unirte a CorpoTurismo, nuestro sistema de gestión de turnos para servicios portuarios.</p>
            
            <div class="credentials">
              <h3>📧 Credenciales temporales:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Contraseña temporal:</strong> <code>${tempPassword}</code></p>
            </div>
            
            <p>Para completar tu registro, haz clic en el siguiente enlace:</p>
            <a href="${invitationUrl}" class="button">Completar Registro</a>
            
            <p><small>⏰ Este enlace expira en 48 horas.</small></p>
            
            <h3>📋 Próximos pasos:</h3>
            <ol>
              <li>Haz clic en "Completar Registro"</li>
              <li>Inicia sesión con tu email y contraseña temporal</li>
              <li>Completa tu información personal</li>
              <li>Crea tu nueva contraseña segura</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>© 2025 CorpoTurismo. Todos los derechos reservados.</p>
            <p>Si no solicitaste esta invitación, puedes ignorar este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>¡Bienvenido a CorpoTurismo!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f8f9fa; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido!</h1>
            <p>Tu cuenta ha sido activada</p>
          </div>
          
          <div class="content">
            <h2>¡Hola ${userName}!</h2>
            <p>Tu registro en CorpoTurismo se ha completado exitosamente. Ya puedes acceder a todas las funcionalidades del sistema.</p>
            
            <a href="${process.env.FRONTEND_URL}/login" class="button">Iniciar Sesión</a>
            
            <h3>🚀 ¿Qué puedes hacer ahora?</h3>
            <ul>
              <li>Ver las recaladas activas</li>
              <li>Gestionar turnos de trabajo</li>
              <li>Consultar información de buques</li>
              <li>Acceder al panel de control</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2025 CorpoTurismo. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();

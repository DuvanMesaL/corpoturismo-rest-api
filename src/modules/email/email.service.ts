import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { LogsService } from '../logs/logs.service';

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly baseUrl = 'https://api.brevo.com/v3';

  constructor(
    private configService: ConfigService,
    private logsService: LogsService,
  ) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME');
  }

  async sendInvitationEmail(
    email: string,
    invitationToken: string,
    tempPassword: string,
    invitedByName: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const invitationUrl = `${frontendUrl}/complete-registration/${invitationToken}`;

    const htmlContent = this.getInvitationTemplate(
      email,
      invitationUrl,
      tempPassword,
      invitedByName,
    );

    const emailData = {
      to: email,
      subject: 'Invitación al Sistema de Turnos Portuarios',
      htmlContent,
      textContent: `Has sido invitado al Sistema de Turnos Portuarios. 
      
Accede con este enlace: ${invitationUrl}
Tu contraseña temporal es: ${tempPassword}

El enlace expira en 48 horas.`,
    };

    return await this.sendEmail(emailData);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = this.getPasswordResetTemplate(userName, resetUrl);

    const emailData = {
      to: email,
      subject: 'Recuperación de Contraseña - Sistema de Turnos',
      htmlContent,
      textContent: `Hola ${userName},

Has solicitado restablecer tu contraseña. Accede al siguiente enlace:
${resetUrl}

Si no solicitaste este cambio, ignora este correo.

El enlace expira en 1 hora.`,
    };

    return await this.sendEmail(emailData);
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const htmlContent = this.getWelcomeTemplate(userName);

    const emailData = {
      to: email,
      subject: '¡Bienvenido al Sistema de Turnos Portuarios!',
      htmlContent,
      textContent: `¡Bienvenido ${userName}!

Tu cuenta ha sido activada exitosamente en el Sistema de Turnos Portuarios.

Ya puedes acceder al sistema y comenzar a gestionar turnos.`,
    };

    return await this.sendEmail(emailData);
  }

  private async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const payload = {
        sender: {
          name: this.senderName,
          email: this.senderEmail,
        },
        to: [
          {
            email: options.to,
          },
        ],
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        this.logger.log(
          `Email enviado exitosamente a ${options.to}. MessageId: ${result.messageId}`,
        );

        // Log del envío exitoso
        await this.logsService.createLog({
          action: 'EMAIL_SENT',
          userId: 0,
          userEmail: 'system',
          entityType: 'Email',
          entityId: result.messageId,
          level: 'info',
          message: `Email enviado a ${options.to}`,
          metadata: {
            subject: options.subject,
            messageId: result.messageId,
          },
        });

        return true;
      } else {
        const error = await response.text();
        this.logger.error(`Error enviando email a ${options.to}: ${error}`);

        // Log del error
        await this.logsService.createLog({
          action: 'EMAIL_FAILED',
          userId: 0,
          userEmail: 'system',
          entityType: 'Email',
          level: 'error',
          message: `Error enviando email a ${options.to}`,
          metadata: {
            subject: options.subject,
            error: error,
            statusCode: response.status,
          },
        });

        return false;
      }
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}:`, error);

      // Log del error
      await this.logsService.createLog({
        action: 'EMAIL_ERROR',
        userId: 0,
        userEmail: 'system',
        entityType: 'Email',
        level: 'error',
        message: `Error crítico enviando email a ${options.to}`,
        metadata: {
          subject: options.subject,
          error: error.message,
        },
      });

      return false;
    }
  }

  private getInvitationTemplate(
    email: string,
    invitationUrl: string,
    tempPassword: string,
    invitedBy: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación al Sistema de Turnos</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .credentials { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚢 Sistema de Turnos Portuarios</h1>
            <p>Invitación de Acceso</p>
        </div>
        
        <div class="content">
            <h2>¡Has sido invitado!</h2>
            <p>Hola,</p>
            <p><strong>${invitedBy}</strong> te ha invitado a formar parte del Sistema de Turnos Portuarios.</p>
            
            <div class="credentials">
                <h3>📧 Credenciales de Acceso:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña temporal:</strong> <code>${tempPassword}</code></p>
            </div>
            
            <p>Para completar tu registro y activar tu cuenta:</p>
            <ol>
                <li>Haz clic en el botón de abajo</li>
                <li>Inicia sesión con tus credenciales temporales</li>
                <li>Completa tu información personal</li>
                <li>Establece una nueva contraseña</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">Completar Registro</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este enlace expira en <strong>48 horas</strong></li>
                    <li>Debes cambiar tu contraseña temporal al completar el registro</li>
                    <li>Si no solicitaste esta invitación, ignora este correo</li>
                </ul>
            </div>
            
            <p>Si tienes problemas con el enlace, copia y pega esta URL en tu navegador:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px;">
                ${invitationUrl}
            </p>
        </div>
        
        <div class="footer">
            <p>Sistema de Turnos Portuarios</p>
            <p>Este es un correo automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperar Contraseña</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Has solicitado restablecer tu contraseña en el Sistema de Turnos Portuarios.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Este enlace expira en <strong>1 hora</strong></li>
                    <li>Si no solicitaste este cambio, ignora este correo</li>
                    <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                </ul>
            </div>
            
            <p>Si tienes problemas con el enlace, copia y pega esta URL en tu navegador:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 3px;">
                ${resetUrl}
            </p>
        </div>
        
        <div class="footer">
            <p>Sistema de Turnos Portuarios</p>
            <p>Este es un correo automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getWelcomeTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f8f9fa; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ¡Bienvenido!</h1>
        </div>
        
        <div class="content">
            <h2>¡Hola ${userName}!</h2>
            
            <div class="success">
                <h3>✅ Cuenta Activada</h3>
                <p>Tu cuenta ha sido activada exitosamente en el Sistema de Turnos Portuarios.</p>
            </div>
            
            <p>Ya puedes acceder al sistema y comenzar a:</p>
            <ul>
                <li>🚢 Gestionar turnos de atención</li>
                <li>📋 Consultar recaladas activas</li>
                <li>⚓ Ver información de buques</li>
                <li>📊 Acceder a reportes y estadísticas</li>
            </ul>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del sistema.</p>
        </div>
        
        <div class="footer">
            <p>Sistema de Turnos Portuarios</p>
            <p>Este es un correo automático, no responder.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

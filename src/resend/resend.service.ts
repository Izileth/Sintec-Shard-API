import { Injectable, Inject } from '@nestjs/common';
import { Resend } from 'resend';


@Injectable()
export class ResendService {

  constructor(@Inject('RESEND') private readonly resend: Resend) {}

  async sendPasswordResetEmail(email: string, name: string, resetLink: string) {
    try {
      await this.resend.emails.send({
        from: 'no-reply@seu-dominio.com',
        to: email,
        subject: 'Redefinição de Senha',
        html: `
          <p>Olá ${name},</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>Clique no link abaixo para continuar:</p>
          <a href="${resetLink}">Redefinir Senha</a>
          <p>Se você não solicitou isso, ignore este email.</p>
        `,
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de redefinição');
    }
  }
}
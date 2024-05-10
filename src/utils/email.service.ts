import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';

dotenv.config();

@Injectable()
export class EmailService {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'lishchishin.volodya@gmail.com',
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  async sendEmailConfirmationMessage(email: string, code: string) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost lishchishin.volodya@gmail.com',
      to: email,
      subject: 'Email confirmation',
      html: `<h1>Thank for your registration</h1><p>To finish registration please follow the link below: <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a> </p>`,
    });
  }

  async sendPasswordRecoveryMessage(email: string, code: string) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost lishchishin.volodya@gmail.com',
      to: email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
      </p>`,
    });
  }
}

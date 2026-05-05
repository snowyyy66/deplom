import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

class RegisterDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Введите имя' })
  name;

  @IsEmail({}, { message: 'Введите корректный email' })
  email;

  @IsString({ message: 'Телефон должен быть строкой' })
  @IsNotEmpty({ message: 'Введите телефон' })
  phone;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password;

  @IsOptional()
  @IsString()
  role;
}

class LoginDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  email;

  @IsString({ message: 'Введите пароль' })
  password;
}

class ForgotPasswordDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  email;
}

class ResetPasswordDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  email;

  @IsString({ message: 'Введите код' })
  @MaxLength(6, { message: 'Код не может быть длиннее 6 символов' })
  code;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  new_password;
}

@Controller('api')
export class AuthController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Post('register')
  async register(@Body() body) {
    const existing = await this.prisma.user.findFirst({ where: { email: body.email } });
    if (existing) throw new BadRequestException('Email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: body.role ?? 'user',
      },
    });

    return this.toUserResponse(user);
  }

  @Post('login')
  async login(@Body() body) {
    const user = await this.prisma.user.findFirst({ where: { email: body.email } });
    if (!user) throw new BadRequestException('Неверный email или пароль');

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Неверный email или пароль');

    return this.toUserResponse(user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.findFirst({ where: { email: body.email } });

    if (!user) return { message: 'If the email exists, a reset code has been sent.' };

    await this.prisma.passwordResetToken.create({
      data: {
        email: body.email,
        token: code,
        expiresAt,
      },
    });

    const sendOk = await this.sendResetEmail(body.email, code);
    if (!sendOk) throw new BadRequestException('Ошибка отправки письма');

    return { message: 'Код восстановления отправлен на вашу почту' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body) {
    const tokenRow = await this.prisma.passwordResetToken.findFirst({
      where: {
        email: body.email,
        token: body.code,
        used: 0,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRow) throw new BadRequestException('Неверный или просроченный код');

    const user = await this.prisma.user.findFirst({ where: { email: body.email } });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const nextPasswordHash = await bcrypt.hash(body.new_password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: nextPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { used: 1 },
      }),
    ]);

    return { message: 'Пароль успешно изменен' };
  }

  toUserResponse(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      has_found_easter_egg: user.hasFoundEasterEgg,
    };
  }

  async sendResetEmail(to, code) {
    const gmailAddress = process.env.GMAIL_ADDRESS;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (!gmailAddress || !gmailAppPassword) return false;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailAddress, pass: gmailAppPassword },
    });

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Look Restaurant</title>
  </head>
  <body style="margin:0; padding:0; background:#0a0a0a; color:#f5f5f5; font-family: Segoe UI, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#141414; border-radius:16px; border:1px solid rgba(255,255,255,0.06); overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 24px; text-align:center; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <h1 style="margin:0; font-size:24px; font-weight:800; color:#f5f5f5; letter-spacing:-0.5px;">Look Restaurant</h1>
                <p style="margin:8px 0 0; font-size:13px; color:#737373;">Восстановление доступа</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px;">
                <p style="margin:0 0 20px; font-size:15px; color:#d4d4d4; line-height:1.6;">
                  Используйте код ниже для восстановления доступа:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:20px 0;">
                      <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1)); border: 1px solid rgba(245,158,11,0.3); border-radius:12px; padding:20px 32px; display:inline-block;">
                        <span style="font-size:36px; font-weight:800; color:#f59e0b; letter-spacing:8px; font-family: 'Courier New', monospace;">
                          ${code}
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0; font-size:13px; color:#737373; line-height:1.6;">
                  Код действителен в течение <strong style="color:#a3a3a3;">15 минут</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 28px; border-top: 1px solid rgba(255,255,255,0.06); text-align:center;">
                <p style="margin:0; font-size:11px; color:#525252;">© Look Restaurant. Это автоматическое письмо.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    try {
      await transporter.sendMail({
        from: `Look Restaurant <${gmailAddress}>`,
        to,
        subject: 'Восстановление пароля — Look Restaurant',
        html,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}

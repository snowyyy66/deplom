import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { signToken } from '../../common/jwt.utils.js';
import { Public } from '../../common/public.decorator.js';

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
  @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
  password;
}

class LoginDto {
  @IsEmail({}, { message: 'Введите корректный email' })
  email;

  @IsString({ message: 'Введите пароль' })
  @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
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

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() body) {
    const emailNorm = String(body.email ?? '').trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({ where: { email: emailNorm } });
    if (existing) throw new BadRequestException('Email уже зарегистрирован');

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: emailNorm,
        phone: body.phone,
        passwordHash,
        role: 'user',
      },
    });

    return { user: this.toUserResponse(user), token: signToken({ sub: user.id }) };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body) {
    const emailNorm = String(body.email ?? '').trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { email: emailNorm } });
    if (!user) throw new BadRequestException('Неверный email или пароль');

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Неверный email или пароль');

    return { user: this.toUserResponse(user), token: signToken({ sub: user.id }) };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body) {
    const emailNorm = String(body.email ?? '').trim().toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.prisma.user.findFirst({ where: { email: emailNorm } });

    if (!user) return { message: 'If the email exists, a reset code has been sent.' };

    const tokenHash = await bcrypt.hash(code, 10);

    await this.prisma.passwordResetToken.create({
      data: {
        email: emailNorm,
        tokenHash,
        expiresAt,
      },
    });

    this.sendResetEmail(emailNorm, code).catch((e) =>
      console.error('[MAILER] reset email background error:', e?.message),
    );

    return { message: 'Код восстановления отправлен на вашу почту' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() body) {
    const emailNorm = String(body.email ?? '').trim().toLowerCase();

    const candidates = await this.prisma.passwordResetToken.findMany({
      where: {
        email: emailNorm,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let tokenRow = null;
    for (const t of candidates) {
      if (t.tokenHash && (await bcrypt.compare(body.code, t.tokenHash))) {
        tokenRow = t;
        break;
      }
    }

    if (!tokenRow) throw new BadRequestException('Неверный или просроченный код');

    const user = await this.prisma.user.findFirst({ where: { email: emailNorm } });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const nextPasswordHash = await bcrypt.hash(body.new_password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: nextPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: tokenRow.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Пароль успешно изменен' };
  }

  @Patch('profile')
  async updateProfile(@Body() body, @Req() req) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Необходима авторизация');

    const data = {};
    if (body.name !== undefined) data.name = String(body.name).trim().slice(0, 100);
    if (body.phone !== undefined) data.phone = String(body.phone).trim().slice(0, 30);

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return this.toUserResponse(updated);
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
      port: 465,
      secure: true,
      auth: { user: gmailAddress, pass: gmailAppPassword },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
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
      const info = await transporter.sendMail({
        from: `Look Restaurant <${gmailAddress}>`,
        to,
        subject: 'Восстановление пароля — Look Restaurant',
        html,
      });
      console.log('[MAILER] reset email sent to', to, '- messageId:', info?.messageId);
      return true;
    } catch (e) {
      console.error('[MAILER] reset email failed for', to, '-', e?.message);
      return false;
    }
  }
}

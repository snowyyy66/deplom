import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  getTransporter() {
    const gmailAddress = process.env.GMAIL_ADDRESS;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (!gmailAddress || !gmailAppPassword) return null;
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailAddress, pass: gmailAppPassword },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  async sendOrderConfirmation(to, order, items) {
    const transporter = this.getTransporter();
    if (!transporter || !to) return;

    const rows = items
      .map(
        (i) =>
          `<tr><td style="padding:8px 0;color:#d4d4d4">${escapeHtml(i.name)} × ${i.quantity}</td><td style="padding:8px 0;text-align:right;color:#f59e0b">${i.price * i.quantity} ₽</td></tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid rgba(255,255,255,0.06)">
        <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#f5f5f5">Look Restaurant</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#737373">Заказ №${order.id} принят</p>
        </td></tr>
        <tr><td style="padding:24px 40px">
          <p style="margin:0 0 12px;font-size:14px;color:#d4d4d4">Здравствуйте, ${escapeHtml(order.recipientName)}!</p>
          <p style="margin:0 0 20px;font-size:14px;color:#a3a3a3">Спасибо за заказ. Мы свяжемся с вами по телефону <strong style="color:#f5f5f5">${escapeHtml(order.phone)}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);margin:12px 0">
            ${rows}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px 0;font-size:16px;font-weight:700;color:#f5f5f5">Итого</td>
              <td style="padding:12px 0;text-align:right;font-size:18px;font-weight:800;color:#f59e0b">${order.totalAmount} ₽</td>
            </tr>
          </table>
          ${order.promoCode ? `<p style="margin:8px 0 0;font-size:12px;color:#737373">Применён промокод: <strong style="color:#a3a3a3">${escapeHtml(order.promoCode)}</strong></p>` : ''}
          <p style="margin:20px 0 0;font-size:13px;color:#a3a3a3">Адрес доставки: ${escapeHtml(order.address)}</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;font-size:11px;color:#525252">Look Restaurant — это автоматическое письмо.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
      const info = await transporter.sendMail({
        from: `Look Restaurant <${process.env.GMAIL_ADDRESS}>`,
        to,
        subject: `Заказ №${order.id} принят — Look Restaurant`,
        html,
      });
      console.log('[MAILER] order confirmation sent to', to, '- messageId:', info?.messageId);
    } catch (e) {
      console.error('[MAILER] order confirmation failed for', to, '-', e?.message);
    }
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

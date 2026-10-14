import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ORDER_STATUSES = ['new', 'preparing', 'delivering', 'completed', 'cancelled'];
const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled'];

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  async getAllMenuItems() {
    const items = await this.prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      category: i.category,
      image_url: i.imageUrl,
      rating: i.rating,
      prep_time: i.prepTime,
      description: i.description ?? undefined,
      tag: i.tag ?? undefined,
    }));
  }

  async createMenuItem(body) {
    const created = await this.prisma.menuItem.create({
      data: {
        name: body.name,
        price: body.price,
        category: body.category,
        imageUrl: body.image_url,
        rating: body.rating,
        prepTime: body.prep_time,
        description: body.description ?? null,
        tag: body.tag ?? null,
      },
    });
    return {
      id: created.id,
      name: created.name,
      price: created.price,
      category: created.category,
      image_url: created.imageUrl,
      rating: created.rating,
      prep_time: created.prepTime,
      description: created.description ?? undefined,
      tag: created.tag ?? undefined,
    };
  }

  async updateMenuItem(id, body) {
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.price !== undefined) data.price = body.price;
    if (body.category !== undefined) data.category = body.category;
    if (body.image_url !== undefined) data.imageUrl = body.image_url;
    if (body.rating !== undefined) data.rating = body.rating;
    if (body.prep_time !== undefined) data.prepTime = body.prep_time;
    if (body.description !== undefined) data.description = body.description;
    if (body.tag !== undefined) data.tag = body.tag;

    const updated = await this.prisma.menuItem.update({ where: { id }, data });
    return {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      category: updated.category,
      image_url: updated.imageUrl,
      rating: updated.rating,
      prep_time: updated.prepTime,
      description: updated.description ?? undefined,
      tag: updated.tag ?? undefined,
    };
  }

  async deleteMenuItem(id) {
    await this.prisma.menuItem.delete({ where: { id } });
    return { success: true };
  }

  async exportMenuCsv() {
    const items = await this.prisma.menuItem.findMany({ orderBy: { id: 'asc' } });
    const header = 'id,name,price,category,image_url,rating,prep_time,description,tag';
    const rows = items.map((i) => {
      const escape = (v) => {
        if (v == null) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      };
      return [i.id, i.name, i.price, i.category, i.imageUrl, i.rating, i.prepTime, i.description, i.tag]
        .map(escape)
        .join(',');
    });
    return [header, ...rows].join('\n');
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      orderBy: { id: 'desc' },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async updateOrderStatus(id, status) {
    if (!ORDER_STATUSES.includes(status)) throw new BadRequestException(`Недопустимый статус: ${status}`);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async getAllReservations() {
    return this.prisma.reservation.findMany({ orderBy: { id: 'desc' } });
  }

  async updateReservationStatus(id, status) {
    if (!RESERVATION_STATUSES.includes(status)) throw new BadRequestException(`Недопустимый статус: ${status}`);
    return this.prisma.reservation.update({ where: { id }, data: { status } });
  }

  async getAllReviews() {
    return this.prisma.review.findMany({ orderBy: { id: 'desc' } });
  }

  async deleteReview(id) {
    await this.prisma.review.delete({ where: { id } });
    return { success: true };
  }

  async getAllMessages() {
    return this.prisma.contactMessage.findMany({ orderBy: { id: 'desc' } });
  }

  async getAllPromoCodes() {
    return this.prisma.promoCode.findMany({ orderBy: { id: 'desc' } });
  }

  async createPromoCode(body) {
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!code) throw new BadRequestException('Введите код промокода');
    if (!Number.isInteger(body.discount) || body.discount < 1 || body.discount > 100) {
      throw new BadRequestException('Скидка должна быть от 1 до 100');
    }
    const exists = await this.prisma.promoCode.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('Такой промокод уже существует');

    return this.prisma.promoCode.create({
      data: {
        code,
        discount: body.discount,
        description: body.description?.trim() || null,
        isActive: body.is_active !== false,
        validFrom: body.valid_from ? new Date(body.valid_from) : null,
        validUntil: body.valid_until ? new Date(body.valid_until) : null,
        usageLimit: body.usage_limit ?? null,
      },
    });
  }

  async updatePromoCode(id, body) {
    const data = {};
    if (body.discount !== undefined) {
      if (!Number.isInteger(body.discount) || body.discount < 1 || body.discount > 100) {
        throw new BadRequestException('Скидка должна быть от 1 до 100');
      }
      data.discount = body.discount;
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.is_active !== undefined) data.isActive = !!body.is_active;
    if (body.valid_from !== undefined) data.validFrom = body.valid_from ? new Date(body.valid_from) : null;
    if (body.valid_until !== undefined) data.validUntil = body.valid_until ? new Date(body.valid_until) : null;
    if (body.usage_limit !== undefined) data.usageLimit = body.usage_limit;
    return this.prisma.promoCode.update({ where: { id }, data });
  }

  async deletePromoCode(id) {
    await this.prisma.promoCode.delete({ where: { id } });
    return { success: true };
  }
}

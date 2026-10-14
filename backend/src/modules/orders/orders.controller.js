import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { ilike } from '../../common/db.utils';
import { Public } from '../../common/public.decorator.js';
import { AdminGuard } from '../../common/admin.guard.js';
import { MailerService } from '../../common/mailer.service.js';


class OrderItemDto {
  @IsInt({ message: 'Некорректный ID блюда' })
  @Min(1, { message: 'Некорректный ID блюда' })
  menu_item_id;

  @IsInt({ message: 'Количество должно быть числом' })
  @Min(1, { message: 'Количество должно быть не менее 1' })
  quantity;

  @IsInt({ message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
  @IsOptional()
  price;
}

class CreateOrderDto {
  @IsString({ message: 'Адрес должен быть строкой' })
  @IsNotEmpty({ message: 'Введите адрес доставки' })
  address;

  @IsString({ message: 'Телефон должен быть строкой' })
  @IsNotEmpty({ message: 'Введите номер телефона' })
  phone;

  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Введите имя получателя' })
  recipient_name;

  @IsEmail({}, { message: 'Введите корректный email' })
  @IsOptional()
  email;

  @IsString({ message: 'Промокод должен быть строкой' })
  @IsOptional()
  promo_code;

  @IsString({ message: 'Комментарий должен быть строкой' })
  @IsOptional()
  comment;

  @IsInt({ message: 'Сумма должна быть числом' })
  @IsOptional()
  total_amount;

  @IsInt({ message: 'Некорректный ID пользователя' })
  @IsOptional()
  user_id;

  @IsArray({ message: 'Список блюд должен быть массивом' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items;
}

function toOrderResponse(o) {
  return {
    id: o.id,
    user_id: o.userId,
    address: o.address,
    phone: o.phone,
    recipient_name: o.recipientName,
    email: o.email,
    promo_code: o.promoCode,
    comment: o.comment,
    total_amount: o.totalAmount,
    status: o.status,
    created_at: o.createdAt,
    items: (o.items ?? []).map((i) => ({
      id: i.id,
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
      price: i.price,
    })),
  };
}

@Controller('api')
export class OrdersController {
  constructor(@Inject(PrismaService) prisma, @Inject(MailerService) mailer) {
    this.prisma = prisma;
    this.mailer = mailer;
  }

  @Public()
  @Post('orders')
  async createOrder(@Body() body, @Req() req) {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Корзина пуста');
    }

    const emailNorm = body.email?.trim().toLowerCase() || null;
    const authedUserId = req.user?.sub ?? null;

    let user = null;
    if (authedUserId) {
      user = await this.prisma.user.findFirst({ where: { id: authedUserId } });
    } else if (emailNorm) {
      user = await this.prisma.user.findFirst({ where: { email: ilike(emailNorm) } });
    }

    const menuIds = [...new Set(body.items.map((i) => i.menu_item_id))];
    const menuItems = await this.prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    const computedItems = body.items.map((it) => {
      const menuItem = menuMap.get(it.menu_item_id);
      if (!menuItem) throw new BadRequestException(`Блюдо id=${it.menu_item_id} не найдено`);
      if (it.quantity > 100) throw new BadRequestException('Слишком большое количество');
      return {
        quantity: it.quantity,
        price: menuItem.price,
        menuItemId: menuItem.id,
        nameSnapshot: menuItem.name,
      };
    });

    let totalAmount = computedItems.reduce((s, i) => s + i.price * i.quantity, 0);

    if (body.promo_code) {
      const code = String(body.promo_code).trim().toUpperCase();
      const promo = await this.prisma.promoCode.findUnique({ where: { code } });
      if (!promo || !promo.isActive) throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');

      const now = new Date();
      if (promo.validFrom && now < promo.validFrom) {
        throw new BadRequestException('Промокод ещё не активен');
      }
      if (promo.validUntil && now > promo.validUntil) {
        throw new BadRequestException('Срок действия промокода истёк');
      }

      if (promo.usageLimit !== null && promo.usageLimit !== undefined) {
        const used = await this.prisma.order.count({ where: { promoCode: code } });
        if (used >= promo.usageLimit) {
          throw new BadRequestException('Промокод исчерпан');
        }
      }

      if (code === 'LOOK20') {
        if (emailNorm) {
          const hasOrders =
            (await this.prisma.order.findFirst({
              where: { email: ilike(emailNorm) },
              select: { id: true },
            })) !== null;
          if (hasOrders) throw new BadRequestException('ТОЛЬКО ДЛЯ ПЕРВОГО ЗАКАЗА');
        }
      } else if (code === 'LOOK15') {
        if (!emailNorm || !user || !user.hasFoundEasterEgg) {
          throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
        }
        const usedLook15 =
          (await this.prisma.order.findFirst({
            where: { email: ilike(emailNorm), promoCode: 'LOOK15' },
            select: { id: true },
          })) !== null;
        if (usedLook15) throw new BadRequestException('Вы уже использовали промокод LOOK15.');
      } else if (code === 'LOOKRUN') {
        if (!user) throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
        if (!user.runnerPromoEligible) {
          throw new BadRequestException('Сначала пройдите мини-игру «Спринт шефа» в разделе заказа.');
        }
      }

      totalAmount = Math.floor(totalAmount * (1 - promo.discount / 100));
    }

    const created = await this.prisma.order.create({
      data: {
        address: body.address,
        phone: body.phone,
        recipientName: body.recipient_name,
        email: emailNorm,
        promoCode: body.promo_code ?? null,
        comment: body.comment ?? null,
        totalAmount,
        userId: authedUserId ?? user?.id ?? null,
        items: { create: computedItems },
      },
      include: { items: true },
    });

    if (body.promo_code === 'LOOKRUN' && user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { runnerPromoEligible: false },
      });
    }

    if (emailNorm) {
      const mailItems = created.items.map((i) => ({
        name: menuMap.get(i.menuItemId)?.name ?? `Блюдо #${i.menuItemId}`,
        quantity: i.quantity,
        price: i.price,
      }));
      this.mailer.sendOrderConfirmation(emailNorm, created, mailItems);
    }

    return toOrderResponse(created);
  }

  @UseGuards(AdminGuard)
  @Get('orders')
  async getAllOrders() {
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows.map(toOrderResponse);
  }

  @Get('orders/user/:user_id')
  async getUserOrders(@Param('user_id', ParseIntPipe) userId, @Req() req) {
    if (req.user?.sub !== userId) throw new ForbiddenException('Доступ запрещён');
    const rows = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows.map(toOrderResponse);
  }
}

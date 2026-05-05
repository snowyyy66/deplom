import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
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

class OrderItemDto {
  @IsInt({ message: 'Некорректный ID блюда' })
  @Min(1, { message: 'Некорректный ID блюда' })
  menu_item_id;

  @IsInt({ message: 'Количество должно быть числом' })
  @Min(1, { message: 'Количество должно быть не менее 1' })
  quantity;

  @IsInt({ message: 'Цена должна быть числом' })
  @Min(0, { message: 'Цена не может быть отрицательной' })
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
  @Min(0, { message: 'Сумма не может быть отрицательной' })
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
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Post('orders')
  async createOrder(@Body() body) {
    const emailNorm = body.email?.trim() || null;

    let user = null;
    if (emailNorm) {
      user = await this.prisma.user.findFirst({
        where: { email: ilike(emailNorm) },
      });
    }

    if (body.promo_code) {
      const validCodes = ['LOOK20', 'LOOK15', 'LOOKRUN'];
      if (!validCodes.includes(body.promo_code)) {
        throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
      }

      if (body.promo_code === 'LOOK20') {
        if (emailNorm) {
          const hasOrders =
            (await this.prisma.order.findFirst({
              where: { email: ilike(emailNorm) },
              select: { id: true },
            })) !== null;
          if (hasOrders) throw new BadRequestException('ТОЛЬКО ДЛЯ ПЕРВОГО ЗАКАЗА');
        }
      } else if (body.promo_code === 'LOOK15') {
        if (!emailNorm || !user || user.hasFoundEasterEgg !== 1) {
          throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
        }
        const usedLook15 =
          (await this.prisma.order.findFirst({
            where: { email: ilike(emailNorm), promoCode: 'LOOK15' },
            select: { id: true },
          })) !== null;
        if (usedLook15) throw new BadRequestException('Вы уже использовали промокод LOOK15.');
      } else if (body.promo_code === 'LOOKRUN') {
        if (!emailNorm || !user) throw new NotFoundException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
        if (user.runnerPromoEligible !== 1) {
          throw new BadRequestException('Сначала пройдите мини-игру «Спринт шефа» в разделе заказа.');
        }
      }
    }

    const created = await this.prisma.order.create({
      data: {
        address: body.address,
        phone: body.phone,
        recipientName: body.recipient_name,
        email: emailNorm,
        promoCode: body.promo_code ?? null,
        comment: body.comment ?? null,
        totalAmount: body.total_amount,
        userId: body.user_id ?? user?.id ?? null,
        items: {
          create: body.items.map((it) => ({
            quantity: it.quantity,
            price: it.price,
            menuItemId: it.menu_item_id,
          })),
        },
      },
      include: { items: true },
    });

    if (body.promo_code === 'LOOKRUN' && user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { runnerPromoEligible: 0 },
      });
    }

    return toOrderResponse(created);
  }

  @Get('orders')
  async getAllOrders() {
    const rows = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows.map(toOrderResponse);
  }

  @Get('orders/user/:user_id')
  async getUserOrders(@Param('user_id', ParseIntPipe) userId) {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows.map(toOrderResponse);
  }
}

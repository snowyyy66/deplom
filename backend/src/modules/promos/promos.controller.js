import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Req } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ilike } from '../../common/db.utils';
import { Public } from '../../common/public.decorator.js';
import { MIN_RUNNER_SCORE } from '../../config/constants';

@Controller('api')
export class PromosController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Public()
  @Get('promo/lookup')
  async lookupPromo(@Query('code') code) {
    const normalized = String(code ?? '').trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Введите код');
    const promo = await this.prisma.promoCode.findUnique({ where: { code: normalized } });
    if (!promo || !promo.isActive) throw new BadRequestException('ПРОМОКОД НЕ СУЩЕСТВУЕТ');
    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      throw new BadRequestException('Промокод ещё не активен');
    }
    if (promo.validUntil && now > promo.validUntil) {
      throw new BadRequestException('Срок действия промокода истёк');
    }
    if (promo.usageLimit !== null && promo.usageLimit !== undefined) {
      const used = await this.prisma.order.count({ where: { promoCode: normalized } });
      if (used >= promo.usageLimit) throw new BadRequestException('Промокод исчерпан');
    }
    return { code: promo.code, discount: promo.discount };
  }

  @Public()
  @Get('promo-status')
  async promoStatus(@Query('email') email) {
    const fallback = {
      look20_available: true,
      look15_available: false,
      has_found_easter_egg: false,
      lookrun_available: false,
      lookrun_used: false,
    };

    const emailNorm = (email ?? '').trim();
    if (!emailNorm) return fallback;

    const user = await this.prisma.user.findFirst({
      where: { email: ilike(emailNorm) },
    });

    const hasOrders =
      (await this.prisma.order.findFirst({
        where: { email: ilike(emailNorm) },
        select: { id: true },
      })) !== null;

    const usedLook15 =
      (await this.prisma.order.findFirst({
        where: {
          email: ilike(emailNorm),
          promoCode: 'LOOK15',
        },
        select: { id: true },
      })) !== null;

    const usedLookrun =
      (await this.prisma.order.findFirst({
        where: { email: ilike(emailNorm), promoCode: 'LOOKRUN' },
        select: { id: true },
      })) !== null;

    const hasFound = !!user?.hasFoundEasterEgg;
    const lookrunAvailable = !!user?.runnerPromoEligible;

    return {
      look20_available: !hasOrders,
      look15_available: !usedLook15 && hasFound,
      has_found_easter_egg: hasFound,
      lookrun_available: lookrunAvailable,
      lookrun_used: usedLookrun,
    };
  }

  @Post('user/found-easter-egg')
  async foundEasterEgg(@Req() req) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Необходима авторизация');

    await this.prisma.user.update({
      where: { id: userId },
      data: { hasFoundEasterEgg: true },
    });

    return { message: 'Easter egg marked as found' };
  }

  @Post('user/runner-reward')
  async runnerReward(@Body() body, @Req() req) {
    if ((body?.score ?? 0) < MIN_RUNNER_SCORE) {
      throw new BadRequestException('Недостаточно очков — добегите до финиша в игре.');
    }

    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Необходима авторизация');

    await this.prisma.user.update({
      where: { id: userId },
      data: { runnerPromoEligible: true },
    });

    return { ok: true };
  }
}

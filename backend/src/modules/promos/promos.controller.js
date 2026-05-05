import { BadRequestException, Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ilike } from '../../common/db.utils';

const MIN_RUNNER_SCORE = 2500;

@Controller('api')
export class PromosController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

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

    const hasFound = user ? user.hasFoundEasterEgg === 1 : false;
    const lookrunAvailable = user ? user.runnerPromoEligible === 1 : false;

    return {
      look20_available: !hasOrders,
      look15_available: !usedLook15 && hasFound,
      has_found_easter_egg: hasFound,
      lookrun_available: lookrunAvailable,
      lookrun_used: usedLookrun,
    };
  }

  @Post('user/found-easter-egg')
  async foundEasterEgg(@Body() body) {
    const email = (body?.email ?? '').trim();
    if (!email) throw new BadRequestException('Укажите email аккаунта');

    const user = await this.prisma.user.findFirst({
      where: { email: ilike(email) },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hasFoundEasterEgg: 1 },
    });

    return { message: 'Easter egg marked as found' };
  }

  @Post('user/runner-reward')
  async runnerReward(@Body() body) {
    if ((body?.score ?? 0) < MIN_RUNNER_SCORE) {
      throw new BadRequestException('Недостаточно очков — добегите до финиша в игре.');
    }

    const emailNorm = (body?.email ?? '').trim().toLowerCase();
    if (!emailNorm) {
      throw new BadRequestException('Укажите email аккаунта, под которым вы вошли на сайт.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: ilike(emailNorm) },
    });

    if (!user) {
      throw new BadRequestException(
        'Аккаунт с такой почтой не найден. Войдите в профиль и попробуйте снова.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { runnerPromoEligible: 1 },
    });

    return { ok: true };
  }
}

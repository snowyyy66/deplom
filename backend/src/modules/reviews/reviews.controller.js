import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/public.decorator.js';

class CreateReviewDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Введите имя' })
  author_name;

  @IsInt({ message: 'Оценка должна быть числом' })
  @Min(1, { message: 'Минимальная оценка — 1' })
  @Max(5, { message: 'Максимальная оценка — 5' })
  rating;

  @IsString({ message: 'Текст должен быть строкой' })
  @IsNotEmpty({ message: 'Напишите текст отзыва' })
  text;

  @IsInt({ message: 'Некорректный ID пользователя' })
  @IsOptional()
  user_id;
}

function toReviewResponse(r) {
  return {
    id: r.id,
    user_id: r.userId,
    author_name: r.authorName,
    rating: r.rating,
    text: r.text,
    created_at: r.createdAt,
  };
}

@Controller('api')
export class ReviewsController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Post('reviews')
  async create(@Body() body, @Req() req) {
    const created = await this.prisma.review.create({
      data: {
        authorName: body.author_name,
        rating: body.rating,
        text: body.text,
        userId: req.user?.sub ?? null,
      },
    });
    return toReviewResponse(created);
  }

  @Public()
  @Get('reviews')
  async list() {
    const rows = await this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toReviewResponse);
  }

  @Get('reviews/user/:user_id')
  async getUserReviews(@Param('user_id', ParseIntPipe) userId, @Req() req) {
    if (req.user?.sub !== userId) throw new ForbiddenException('Доступ запрещён');
    const rows = await this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toReviewResponse);
  }
}

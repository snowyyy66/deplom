import { Controller, Get, Body, Post, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/menu')
export class MenuController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Get()
  async getMenu() {
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

  @Post()
  async createMenuItem(@Body() body) {
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
}

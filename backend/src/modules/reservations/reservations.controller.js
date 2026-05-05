import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { MAX_TABLES } from '../../config/constants';

class CreateReservationDto {
  @IsInt({ message: 'Некорректный ID пользователя' })
  @IsOptional()
  user_id;

  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Введите имя' })
  name;

  @IsString({ message: 'Телефон должен быть строкой' })
  @IsNotEmpty({ message: 'Введите номер телефона' })
  phone;

  @IsDateString({}, { message: 'Введите корректную дату' })
  date;

  @IsString({ message: 'Время должно быть строкой' })
  @IsNotEmpty({ message: 'Выберите время' })
  time;

  @IsInt({ message: 'Количество гостей должно быть числом' })
  @Min(1, { message: 'Минимум 1 гость' })
  guests_count;

  @IsInt({ message: 'Номер стола должен быть числом' })
  @Min(1, { message: 'Номер стола должен быть не менее 1' })
  @Max(MAX_TABLES, { message: `Номер стола не может превышать ${MAX_TABLES}` })
  @IsOptional()
  table_number;

  @IsString({ message: 'Примечание должно быть строкой' })
  @IsOptional()
  notes;
}

function parseYmdUTC(ymd) {
  return new Date(ymd + 'T00:00:00.000Z');
}

function dayRange(ymd) {
  const start = parseYmdUTC(ymd);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function toReservationResponse(r) {
  return {
    id: r.id,
    user_id: r.userId,
    name: r.name,
    phone: r.phone,
    date: r.date,
    time: r.time,
    guests_count: r.guestsCount,
    table_number: r.tableNumber ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    created_at: r.createdAt,
  };
}

@Controller('api')
export class ReservationsController {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  @Get('reservations/availability')
  async availability(@Query('date') date, @Query('time') time) {
    const { start, end } = dayRange(date);

    const reservations = await this.prisma.reservation.findMany({
      where: { date: { gte: start, lt: end }, time, status: { not: 'cancelled' } },
      select: { tableNumber: true },
    });

    const bookedTables = reservations.map((r) => r.tableNumber).filter((x) => x !== null);
    return {
      total_tables: MAX_TABLES,
      booked_tables: bookedTables,
      available: Math.max(0, MAX_TABLES - bookedTables.length),
    };
  }

  @Post('reservations')
  async create(@Body() body) {
    const { start, end } = dayRange(body.date);

    if (body.table_number !== undefined && body.table_number !== null) {
      const exists = await this.prisma.reservation.findFirst({
        where: {
          date: { gte: start, lt: end },
          time: body.time,
          tableNumber: body.table_number,
          status: { not: 'cancelled' },
        },
        select: { id: true },
      });
      if (exists) {
        throw new ConflictException(`Стол №${body.table_number} уже забронирован на это время.`);
      }
    } else {
      const bookedCount = await this.prisma.reservation.count({
        where: { date: { gte: start, lt: end }, time: body.time, status: { not: 'cancelled' } },
      });
      if (bookedCount >= MAX_TABLES) {
        throw new ConflictException('Извините, на это время все столы заняты.');
      }
    }

    const created = await this.prisma.reservation.create({
      data: {
        userId: body.user_id ?? null,
        name: body.name,
        phone: body.phone,
        date: start,
        time: body.time,
        guestsCount: body.guests_count,
        tableNumber: body.table_number ?? null,
        notes: body.notes ?? null,
      },
    });

    return toReservationResponse(created);
  }

  @Get('reservations')
  async list() {
    const rows = await this.prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toReservationResponse);
  }

  @Get('reservations/user/:user_id')
  async getUserReservations(@Param('user_id', ParseIntPipe) userId) {
    const rows = await this.prisma.reservation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toReservationResponse);
  }

  @Patch('reservations/:reservation_id/cancel')
  async cancel(@Param('reservation_id', ParseIntPipe) id) {
    const reservation = await this.prisma.reservation.findFirst({ where: { id } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === 'cancelled') throw new BadRequestException('Already cancelled');

    await this.prisma.reservation.update({ where: { id }, data: { status: 'cancelled' } });
    return { ok: true };
  }
}

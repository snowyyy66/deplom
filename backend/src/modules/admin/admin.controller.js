import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ForbiddenException,
  ParseIntPipe,
  Header,
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { AdminService } from './admin.service';
import { signToken } from '../../common/jwt.utils.js';
import { AdminGuard } from '../../common/admin.guard.js';
import { Public } from '../../common/public.decorator.js';
import { Throttle } from '@nestjs/throttler';

const UPLOAD_DIR = './uploads';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) adminService) {
    this.adminService = adminService;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async adminLogin(@Body() body) {
    const input = String(body?.password ?? '');
    const hash = process.env.ADMIN_PASSWORD_HASH;
    const plain = process.env.ADMIN_PASSWORD;

    let ok = false;
    if (hash) {
      ok = await bcrypt.compare(input, hash);
    } else if (plain) {
      const a = Buffer.from(input);
      const b = Buffer.from(plain);
      ok = a.length === b.length && timingSafeEqual(a, b);
    }

    if (!ok) throw new ForbiddenException('Неверный пароль');
    return { token: signToken({ role: 'admin' }, '8h') };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname).toLowerCase());
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Поддерживаются только jpg/png/webp/gif'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file) {
    if (!file) throw new BadRequestException('Файл не загружен');
    return { url: `/uploads/${file.filename}` };
  }

  @Get('menu/export-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="menu.csv"')
  async exportMenuCsv() {
    return this.adminService.exportMenuCsv();
  }

  @Get('menu')
  async getMenu() {
    return this.adminService.getAllMenuItems();
  }

  @Post('menu')
  async createMenuItem(@Body() body) {
    return this.adminService.createMenuItem(body);
  }

  @Patch('menu/:id')
  async updateMenuItem(@Param('id', ParseIntPipe) id, @Body() body) {
    return this.adminService.updateMenuItem(id, body);
  }

  @Delete('menu/:id')
  async deleteMenuItem(@Param('id', ParseIntPipe) id) {
    return this.adminService.deleteMenuItem(id);
  }

  @Get('orders')
  async getOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id', ParseIntPipe) id, @Body() body) {
    return this.adminService.updateOrderStatus(id, body.status);
  }

  @Get('reservations')
  async getReservations() {
    return this.adminService.getAllReservations();
  }

  @Patch('reservations/:id/status')
  async updateReservationStatus(@Param('id', ParseIntPipe) id, @Body() body) {
    return this.adminService.updateReservationStatus(id, body.status);
  }

  @Get('reviews')
  async getReviews() {
    return this.adminService.getAllReviews();
  }

  @Delete('reviews/:id')
  async deleteReview(@Param('id', ParseIntPipe) id) {
    return this.adminService.deleteReview(id);
  }

  @Get('messages')
  async getMessages() {
    return this.adminService.getAllMessages();
  }

  @Get('promos')
  async getPromos() {
    return this.adminService.getAllPromoCodes();
  }

  @Post('promos')
  async createPromo(@Body() body) {
    return this.adminService.createPromoCode(body);
  }

  @Patch('promos/:id')
  async updatePromo(@Param('id', ParseIntPipe) id, @Body() body) {
    return this.adminService.updatePromoCode(id, body);
  }

  @Delete('promos/:id')
  async deletePromo(@Param('id', ParseIntPipe) id) {
    return this.adminService.deletePromoCode(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  ForbiddenException,
  ParseIntPipe,
  Header,
  Inject,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { signToken, verifyToken } from '../../common/jwt.utils.js';

@Controller('api/admin')
export class AdminController {
  constructor(@Inject(AdminService) adminService) {
    this.adminService = adminService;
  }

  @Post('login')
  async adminLogin(@Body() body) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || body.password !== adminPassword) {
      throw new ForbiddenException('Неверный пароль');
    }
    return { token: signToken({ role: 'admin' }, '8h') };
  }

  checkAdminToken(headers) {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new ForbiddenException('Admin token required');
    try {
      const payload = verifyToken(authHeader.slice(7));
      if (payload.role !== 'admin') throw new Error();
    } catch {
      throw new ForbiddenException('Invalid admin token');
    }
  }

  @Get('menu/export-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="menu.csv"')
  async exportMenuCsv(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.exportMenuCsv();
  }

  @Get('menu')
  async getMenu(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.getAllMenuItems();
  }

  @Post('menu')
  async createMenuItem(
    @Headers() headers,
    @Body() body,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.createMenuItem(body);
  }

  @Patch('menu/:id')
  async updateMenuItem(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.updateMenuItem(id, body);
  }

  @Delete('menu/:id')
  async deleteMenuItem(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.deleteMenuItem(id);
  }

  @Get('orders')
  async getOrders(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.getAllOrders();
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.updateOrderStatus(id, body.status);
  }

  @Get('reservations')
  async getReservations(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.getAllReservations();
  }

  @Patch('reservations/:id/status')
  async updateReservationStatus(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.updateReservationStatus(id, body.status);
  }

  @Get('reviews')
  async getReviews(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.getAllReviews();
  }

  @Delete('reviews/:id')
  async deleteReview(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
  ) {
    this.checkAdminToken(headers);
    return this.adminService.deleteReview(id);
  }

  @Get('messages')
  async getMessages(@Headers() headers) {
    this.checkAdminToken(headers);
    return this.adminService.getAllMessages();
  }
}

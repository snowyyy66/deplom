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

const ADMIN_KEY = 'look-admin-2024';

@Controller('api/admin')
export class AdminController {
  constructor(@Inject(AdminService) adminService) {
    this.adminService = adminService;
  }

  checkKey(headers) {
    if (headers['x-admin-key'] !== ADMIN_KEY) {
      throw new ForbiddenException('Invalid admin key');
    }
  }

  @Get('menu/export-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="menu.csv"')
  async exportMenuCsv(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.exportMenuCsv();
  }

  @Get('menu')
  async getMenu(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.getAllMenuItems();
  }

  @Post('menu')
  async createMenuItem(
    @Headers() headers,
    @Body() body,
  ) {
    this.checkKey(headers);
    return this.adminService.createMenuItem(body);
  }

  @Patch('menu/:id')
  async updateMenuItem(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkKey(headers);
    return this.adminService.updateMenuItem(id, body);
  }

  @Delete('menu/:id')
  async deleteMenuItem(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
  ) {
    this.checkKey(headers);
    return this.adminService.deleteMenuItem(id);
  }

  @Get('orders')
  async getOrders(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.getAllOrders();
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkKey(headers);
    return this.adminService.updateOrderStatus(id, body.status);
  }

  @Get('reservations')
  async getReservations(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.getAllReservations();
  }

  @Patch('reservations/:id/status')
  async updateReservationStatus(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
    @Body() body,
  ) {
    this.checkKey(headers);
    return this.adminService.updateReservationStatus(id, body.status);
  }

  @Get('reviews')
  async getReviews(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.getAllReviews();
  }

  @Delete('reviews/:id')
  async deleteReview(
    @Headers() headers,
    @Param('id', ParseIntPipe) id,
  ) {
    this.checkKey(headers);
    return this.adminService.deleteReview(id);
  }

  @Get('messages')
  async getMessages(@Headers() headers) {
    this.checkKey(headers);
    return this.adminService.getAllMessages();
  }
}

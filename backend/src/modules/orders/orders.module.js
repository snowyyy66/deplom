import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersController } from './orders.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
})
export class OrdersModule {}

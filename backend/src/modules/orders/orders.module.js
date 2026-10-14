import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { MailerService } from '../../common/mailer.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [MailerService],
})
export class OrdersModule {}

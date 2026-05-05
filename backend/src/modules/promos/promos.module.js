import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PromosController } from './promos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PromosController],
})
export class PromosModule {}

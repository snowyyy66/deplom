import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  async saveMessage(name, contact, message) {
    return this.prisma.contactMessage.create({
      data: { name, contact, message },
    });
  }
}

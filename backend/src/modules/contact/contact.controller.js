import { Controller, Post, Body, BadRequestException, Inject } from '@nestjs/common';
import { ContactService } from './contact.service';
import { Public } from '../../common/public.decorator.js';

@Controller('api/contact')
export class ContactController {
  constructor(@Inject(ContactService) contactService) {
    this.contactService = contactService;
  }

  @Public()
  @Post()
  async sendMessage(@Body() body) {
    const { name, contact, message } = body;
    if (!name || !contact || !message) {
      throw new BadRequestException('name, contact and message are required');
    }
    if (name.length > 100) throw new BadRequestException('name too long');
    if (contact.length > 200) throw new BadRequestException('contact too long');
    if (message.length > 2000) throw new BadRequestException('message too long');
    const saved = await this.contactService.saveMessage(
      name.trim(), contact.trim(), message.trim()
    );
    return { success: true, id: saved.id };
  }
}

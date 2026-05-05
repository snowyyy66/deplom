import { Controller, Post, Body, BadRequestException, Inject } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('api/contact')
export class ContactController {
  constructor(@Inject(ContactService) contactService) {
    this.contactService = contactService;
  }

  @Post()
  async sendMessage(@Body() body) {
    const { name, contact, message } = body;
    if (!name || !contact || !message) {
      throw new BadRequestException('name, contact and message are required');
    }
    const saved = await this.contactService.saveMessage(name, contact, message);
    return { success: true, id: saved.id };
  }
}

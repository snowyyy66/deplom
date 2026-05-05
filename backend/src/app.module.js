import { Module } from '@nestjs/common';
import { MenuModule } from './modules/menu/menu.module';
import { PromosModule } from './modules/promos/promos.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [MenuModule, PromosModule, AuthModule, OrdersModule, ReservationsModule, ReviewsModule, AdminModule, ContactModule],
})
export class AppModule {}

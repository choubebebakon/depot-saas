import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { TablesService } from './tables.service';
import { CommandesService } from './commandes.service';
import { PlatsService } from './plats.service';
import { CuisineService } from './cuisine.service';
import { ReservationsService } from './reservations.service';
import { RestaurantController } from './restaurant.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantController],
  providers: [
    TablesService,
    CommandesService,
    PlatsService,
    CuisineService,
    ReservationsService,
  ],
  exports: [
    TablesService,
    CommandesService,
    PlatsService,
    CuisineService,
    ReservationsService,
  ],
})
export class RestaurantModule {}

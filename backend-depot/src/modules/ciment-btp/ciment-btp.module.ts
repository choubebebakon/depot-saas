import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma.module';
import { CimentBtpController } from './ciment-btp.controller';
import { CimentBtpService } from './ciment-btp.service';

@Module({
  imports: [PrismaModule],
  controllers: [CimentBtpController],
  providers: [CimentBtpService],
  exports: [CimentBtpService],
})
export class CimentBtpModule {}

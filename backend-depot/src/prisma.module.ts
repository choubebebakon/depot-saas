import { Global, Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [CommonModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

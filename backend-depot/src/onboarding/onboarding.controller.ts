import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { MetierType } from '../common/config/metier-roles.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('metier')
  async setupMetier(@Req() req: any, @Body('metier') metier: MetierType) {
    if (metier === MetierType.DEPOT_BOISSONS) {
      throw new BadRequestException('Métier non autorisé ici');
    }
    return this.onboardingService.setupMetier(req.user.tenantId, metier, req.user.userId);
  }
}

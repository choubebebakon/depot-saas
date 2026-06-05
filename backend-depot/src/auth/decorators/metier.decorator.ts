import { SetMetadata } from '@nestjs/common';
import { MetierType } from '../../common/config/metier-roles.config';

export const METIER_KEY = 'metier';
export const Metier = (metier: MetierType) => SetMetadata(METIER_KEY, metier);

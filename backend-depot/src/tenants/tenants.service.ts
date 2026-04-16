import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // On va créer ce fichier juste après
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

import { StatutAbonnement } from '@prisma/client';

@Injectable()
export class TenantsService {
  // On connecte Prisma au service
  constructor(private prisma: PrismaService) { }

  async create(createTenantDto: CreateTenantDto) {
    // LOGIQUE V1.3 & V1.4 : Calcul de la fin de l'essai gratuit (J+30)
    const dateFinEssai = new Date();
    dateFinEssai.setDate(dateFinEssai.getDate() + 30);

    return this.prisma.tenant.create({
      data: {
        nomEntreprise: createTenantDto.nomEntreprise,
        emailPatron: createTenantDto.emailPatron,
        telephone: createTenantDto.telephone,
        dateEssaiFin: dateFinEssai,
        // Automatisation du Paywall SaaS
        dateExpiration: dateFinEssai,
        statutAbonnement: StatutAbonnement.TRIAL,
        estActif: true,
      },
    });
  }

  async findAll() {
    // Récupère tous les patrons avec leurs dépôts (sites)
    return this.prisma.tenant.findMany({
      include: { sites: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: { sites: true },
    });
  }

  // ... Tu pourras ajouter update et remove plus tard
}
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Création des données initiales...');

    // 1. Tenant
    const tenant = await prisma.tenant.create({
        data: {
            nomEntreprise: 'Mon Dépôt Boissons',
            emailPatron: 'patron@depot.cm',
            telephone: '+237600000000',
            statutAbonnement: 'TRIAL',
            dateEssaiFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            estActif: true,
        },
    });
    console.log('✅ Tenant créé :', tenant.id);

    // 2. Site
    const site = await prisma.depot.create({
        data: {
            nom: 'Dépôt Principal',
            adresse: 'Douala, Cameroun',
            emplacement: 'Akwa',
            codePrefix: 'AKW',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Site créé :', site.id);

    // 3. Familles
    const familleBiere = await prisma.famille.create({
        data: { nom: 'Bière', emoji: '🍺', tenantId: tenant.id },
    });
    const familleJus = await prisma.famille.create({
        data: { nom: 'Jus', emoji: '🥤', tenantId: tenant.id },
    });
    const familleEau = await prisma.famille.create({
        data: { nom: 'Eau', emoji: '💧', tenantId: tenant.id },
    });
    console.log('✅ Familles créées');

    // 4. Marques
    const sabc = await prisma.marque.create({
        data: { nom: 'SABC', familleId: familleBiere.id, tenantId: tenant.id },
    });
    const guinness = await prisma.marque.create({
        data: { nom: 'Guinness', familleId: familleBiere.id, tenantId: tenant.id },
    });
    const source = await prisma.marque.create({
        data: { nom: 'Source du Pays', familleId: familleEau.id, tenantId: tenant.id },
    });
    console.log('✅ Marques créées');

    // 5. Articles
    const castel = await prisma.article.create({
        data: {
            designation: 'Castel Beer', format: '65cl',
            prixVente: 600, prixAchat: 400, seuilCritique: 24,
            uniteParCasier: 12, uniteParPack: 6, uniteParPalette: 120,
            familleId: familleBiere.id, marqueId: sabc.id, tenantId: tenant.id,
        },
    });
    const mutzig = await prisma.article.create({
        data: {
            designation: 'Mutzig', format: '33cl',
            prixVente: 500, prixAchat: 320, seuilCritique: 24,
            uniteParCasier: 24, uniteParPack: 6, uniteParPalette: 240,
            familleId: familleBiere.id, marqueId: sabc.id, tenantId: tenant.id,
        },
    });
    const guinnessArt = await prisma.article.create({
        data: {
            designation: 'Guinness Smooth', format: '50cl',
            prixVente: 700, prixAchat: 480, seuilCritique: 12,
            uniteParCasier: 12, uniteParPack: 4, uniteParPalette: 96,
            familleId: familleBiere.id, marqueId: guinness.id, tenantId: tenant.id,
        },
    });
    const sourceArt = await prisma.article.create({
        data: {
            designation: 'Source du Pays', format: '1.5L',
            prixVente: 400, prixAchat: 250, seuilCritique: 12,
            uniteParCasier: 12, uniteParPack: 6, uniteParPalette: 96,
            familleId: familleEau.id, marqueId: source.id, tenantId: tenant.id,
        },
    });
    console.log('✅ Articles créés');

    // 6. Stocks
    for (const art of [castel, mutzig, guinnessArt, sourceArt]) {
        await prisma.stock.create({
            data: { articleId: art.id, depotId: site.id, quantite: 120 },
        });
    }
    console.log('✅ Stocks initialisés (120 unités chacun)');

    // 7. Utilisateur Patron
    const hash = await bcrypt.hash('depot2026', 12);
    await prisma.user.create({
        data: {
            email: 'patron@depot.cm',
            password: hash,
            role: 'PATRON',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Utilisateur créé : patron@depot.cm');

    console.log('\n========================================');
    console.log('🎉 SEED TERMINÉ AVEC SUCCÈS !');
    console.log('========================================');
    console.log('   Email    : patron@depot.cm');
    console.log('   Password : depot2026');
    console.log('========================================\n');
}

main()
    .catch((e) => { console.error('❌ Erreur seed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

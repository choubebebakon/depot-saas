/**
 * Migration script to clean up duplicate "Depot Principal" entries
 * 
 * This script:
 * 1. Finds all duplicate "Depot Principal" for each tenant
 * 2. Identifies the canonical depot (oldest createdAt)
 * 3. Reassigns all related data to the canonical depot
 * 4. Deletes the duplicate depots
 * 
 * USAGE:
 * 1. Review the script logic
 * 2. Run with: npx ts-node scripts/cleanup-duplicate-depots.ts
 * 3. Verify results in Prisma Studio
 * 
 * BACKUP: Take a database backup before running this script!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateDepots() {
  console.log('🔍 Starting duplicate depot cleanup...');
  
  // Find all tenants with duplicate "Depot Principal"
  const duplicateGroups = await prisma.$queryRaw<Array<{ tenant_id: string; count: bigint }>>`
    SELECT tenant_id, COUNT(*) as count
    FROM Depot
    WHERE nom = 'Depot Principal'
    GROUP BY tenant_id
    HAVING COUNT(*) > 1
  `;
  
  console.log(`Found ${duplicateGroups.length} tenants with duplicate "Depot Principal"`);
  
  for (const group of duplicateGroups) {
    const tenantId = group.tenant_id as string;
    console.log(`\n📦 Processing tenant: ${tenantId}`);
    
    // Get all "Depot Principal" for this tenant, ordered by createdAt (oldest first)
    const depots = await prisma.depot.findMany({
      where: {
        tenantId,
        nom: 'Depot Principal',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (depots.length <= 1) {
      console.log('  ✅ No duplicates found for this tenant');
      continue;
    }
    
    console.log(`  Found ${depots.length} depots: ${depots.map(d => d.id).join(', ')}`);
    
    // The oldest depot is the canonical one
    const canonicalDepot = depots[0];
    const duplicateDepots = depots.slice(1);
    
    console.log(`  🎯 Canonical depot: ${canonicalDepot.id} (created: ${canonicalDepot.createdAt})`);
    console.log(`  🗑️  Duplicates to remove: ${duplicateDepots.map(d => d.id).join(', ')}`);
    
    // Count related data for each depot to understand impact
    for (const depot of depots) {
      const [clients, fournisseurs, stocks, depenses, users] = await Promise.all([
        prisma.client.count({ where: { depotId: depot.id } }),
        prisma.fournisseur.count({ where: { depotId: depot.id } }),
        prisma.stock.count({ where: { depotId: depot.id } }),
        prisma.depense.count({ where: { depotId: depot.id } }),
        prisma.user.count({ where: { depotId: depot.id } }),
      ]);
      
      console.log(`    Depot ${depot.id}: ${clients} clients, ${fournisseurs} fournisseurs, ${stocks} stocks, ${depenses} depenses, ${users} users`);
    }
    
    // Reassign all data from duplicate depots to canonical depot
    for (const duplicateDepot of duplicateDepots) {
      console.log(`  🔄 Reassigning data from ${duplicateDepot.id} to ${canonicalDepot.id}...`);
      
      await prisma.$transaction(async (tx) => {
        // Reassign Clients
        await tx.client.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign Fournisseurs
        await tx.fournisseur.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign Stocks
        await tx.stock.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign Depenses
        await tx.depense.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign Users
        await tx.user.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign Ventes
        await tx.vente.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign MouvementStock
        await tx.mouvementStock.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Reassign ReceptionFournisseur
        await tx.receptionFournisseur.updateMany({
          where: { depotId: duplicateDepot.id },
          data: { depotId: canonicalDepot.id },
        });
        
        // Delete the duplicate depot
        await tx.depot.delete({
          where: { id: duplicateDepot.id },
        });
      });
      
      console.log(`  ✅ Deleted duplicate depot ${duplicateDepot.id}`);
    }
  }
  
  console.log('\n✨ Cleanup completed successfully!');
  console.log('📊 Please verify results in Prisma Studio');
}

// Run the cleanup
cleanupDuplicateDepots()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

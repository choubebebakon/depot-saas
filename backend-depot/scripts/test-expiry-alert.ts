import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SubscriptionLifecycleService } from '../src/billing/services/subscription-lifecycle.service';

async function testExpiryAlert() {
  console.log('🚀 Démarrage du script de test d\'alerte d\'expiration...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const lifecycleService = app.get(SubscriptionLifecycleService);

  try {
    console.log('📧 Déclenchement de l\'alerte J-5...');
    const sent = await lifecycleService.sendExpiryAlerts(5, 'EXPIRY_J5' as any);
    console.log(`✅ Alertes envoyées : ${sent} tenant(s)`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des alertes:', error);
  } finally {
    await app.close();
    console.log('👋 Script terminé');
  }
}

testExpiryAlert();

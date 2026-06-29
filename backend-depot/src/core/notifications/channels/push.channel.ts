import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);
  private initialized = false;
  private firebaseApp: any;

  constructor(private configService: ConfigService) {
    this.initFirebase();
  }

  private initFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase non configuré — Push désactivé (mode dégradé)',
      );
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.firebaseApp = admin;
      this.initialized = true;
      this.logger.log('PushChannel initialisé (Firebase)');
    } catch (e: any) {
      this.logger.error(`Erreur initialisation Firebase: ${e.message}`);
    }
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    if (!this.initialized || !this.firebaseApp) {
      this.logger.log(
        `[PUSH LOG] Device: ${token.substring(0, 20)}... | Title: ${title}`,
      );
      return true;
    }

    try {
      await this.firebaseApp.messaging().send({
        token,
        notification: { title, body },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      return true;
    } catch (e: any) {
      this.logger.error(`Échec push device: ${e.message}`);
      return false;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    if (!this.initialized || !this.firebaseApp) {
      this.logger.log(`[PUSH LOG] Topic: ${topic} | Title: ${title}`);
      return true;
    }

    try {
      await this.firebaseApp.messaging().send({
        topic,
        notification: { title, body },
      });
      return true;
    } catch (e: any) {
      this.logger.error(`Échec push topic ${topic}: ${e.message}`);
      return false;
    }
  }
}

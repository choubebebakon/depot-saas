import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// On force le chargement du fichier .env manuellement
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
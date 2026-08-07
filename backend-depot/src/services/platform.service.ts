import axios from 'axios';

// On définit le type pour que TypeScript nous aide (autocomplétion)
export interface PlatformStats {
  totalMrr: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  createdAt: string;
}

// Service pour appeler ton backend NestJS
export const getPlatformStats = async (): Promise<PlatformStats> => {
  const { data } = await axios.get('/api/v1/platform/stats', {
    withCredentials: true, // Important si tu utilises des cookies pour ton JWT
  });
  return data;
};
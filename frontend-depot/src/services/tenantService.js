import api from '../api'; // Assure-toi que le chemin vers ton instance axios est correct

/**
 * Récupère les informations du tenant (entreprise) et ses dépôts
 * via l'API backend.
 */
export async function fetchTenant() {
  try {
    const response = await api.get('/tenant/info'); 
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération du tenant:", error);
    throw error;
  }
}
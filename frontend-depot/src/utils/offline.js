import { v4 as uuidv4 } from 'uuid';

/**
 * Génère un UUID v4 standard.
 */
export const generateId = () => uuidv4();

/**
 * Génère une référence lisible (ex: FAC-...) avec un préfixe pour éviter les collisions.
 * @param {string} prefix - Le préfixe (ex: ID du commercial ou code Dépôt)
 * @param {string} type - Le type de document (FAC, DEP, CLT)
 */
export const generateReference = (prefix, type = 'FAC') => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const timeStr = now.getTime().toString().slice(-4); // 4 derniers chiffres du timestamp
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 chars random

  const cleanPrefix = prefix ? prefix.slice(0, 4).toUpperCase() : 'APP';
  
  return `${type}-${cleanPrefix}-${dateStr}-${timeStr}-${randomStr}`;
};





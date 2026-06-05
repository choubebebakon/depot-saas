export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  // On ne garde que les chiffres
  let cleaned = phone.replace(/\D/g, '');
  
  // Logique de conversion vers +237
  if (cleaned.startsWith('237')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('6')) {
    return '+237' + cleaned;
  }
  return '+' + cleaned;
};
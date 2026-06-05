export function required(value, fieldName = 'Ce champ') {
  if (value === null || value === undefined || value === '') return `${fieldName} est requis`;
  return null;
}

export function isEmail(value) {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : 'Email invalide';
}

export function isPhone(value) {
  if (!value) return null;
  const re = /^[+]?[\d\s()-]{6,}$/;
  return re.test(value) ? null : 'Numéro de téléphone invalide';
}

export function isPositiveNumber(value, fieldName = 'La valeur') {
  const n = Number(value);
  if (isNaN(n)) return `${fieldName} doit être un nombre`;
  if (n < 0) return `${fieldName} doit être positif`;
  return null;
}

export function isRequiredNumber(value, fieldName = 'Ce champ') {
  if (value === null || value === undefined || value === '') return `${fieldName} est requis`;
  return isPositiveNumber(value, fieldName);
}

export function minLength(value, min, fieldName = 'Ce champ') {
  if (!value || value.length < min) return `${fieldName} doit contenir au moins ${min} caractères`;
  return null;
}

export function validateForm(values, rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(values[field]);
      if (error) { errors[field] = error; break; }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

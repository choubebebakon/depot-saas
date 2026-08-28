export function resolveMediaUrl(value) {
  if (!value) return null;
  if (value.startsWith('data:image/')) return value;
  if (/^https?:\/\//i.test(value)) return value;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const origin = apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

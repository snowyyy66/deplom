const isSQLite = () => (process.env.DATABASE_URL ?? '').startsWith('file:');

export function ilike(value) {
  return isSQLite() ? { equals: value } : { equals: value, mode: 'insensitive' };
}

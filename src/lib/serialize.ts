/**
 * Converts Prisma result objects to plain JSON-compatible values.
 * - Prisma.Decimal  → JavaScript number
 * - Date            → ISO string
 * Safe to call on any Prisma query result before returning from server
 * actions or passing to client components.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

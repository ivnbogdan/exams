/** Server-only environment access. Throws on first use if a required variable is missing. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get r2PublicBaseUrl() {
    return required("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  },
};

/** Public URL of an object stored in R2. */
export function fileUrl(storageKey: string): string {
  return `${env.r2PublicBaseUrl}/${storageKey}`;
}

/** Server-only environment access. Throws on first use if a required variable is missing. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

/**
 * Site origin for metadata, sitemap and canonical links. Accepts NEXT_PUBLIC_SITE_URL with or
 * without a scheme, then falls back to the hostnames Vercel injects, then to localhost, so a
 * misconfigured variable degrades gracefully instead of failing the build with "Invalid URL".
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "http://localhost:3000",
  ];
  for (const raw of candidates) {
    const c = raw?.trim();
    if (!c) continue;
    const withScheme = /^https?:\/\//i.test(c) ? c : `https://${c}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // try the next candidate
    }
  }
  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get r2PublicBaseUrl() {
    return required("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
  },
  get siteUrl() {
    return siteUrl;
  },
};

/** Public URL of an object stored in R2. */
export function fileUrl(storageKey: string): string {
  return `${env.r2PublicBaseUrl}/${storageKey}`;
}

/** Verifies R2 credentials, bucket access and the public base URL. Prints no secrets. `pnpm r2:check` */
import { HeadBucketCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { r2ConfigFromEnv } from "./lib/r2";

config({ path: ".env.local", quiet: true });

async function main() {
  const cfg = r2ConfigFromEnv();
  const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  if (!publicBase) throw new Error("R2_PUBLIC_BASE_URL is not set");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  await client.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
  console.log(`bucket "${cfg.bucket}": reachable with these credentials`);
  const list = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 5 }));
  console.log(`objects in bucket (first page): ${list.KeyCount ?? 0}${list.IsTruncated ? "+" : ""}`);
  const probe = `${publicBase}/__connectivity_probe_${Date.now()}`;
  const res = await fetch(probe, { method: "GET" });
  const host = new URL(publicBase).host;
  if (res.status === 404) console.log(`public URL host ${host}: answers (404 for a missing key, as expected)`);
  else console.log(`public URL host ${host}: unexpected status ${res.status} for a missing key`);
}

main().catch((e) => {
  console.error("R2 check failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});

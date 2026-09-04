/** Cloudflare R2 through the S3 API. */
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export function r2ConfigFromEnv(): R2Config {
  const get = (k: string) => {
    const v = process.env[k];
    if (!v) throw new Error(`Missing environment variable ${k}`);
    return v;
  };
  return {
    accountId: get("R2_ACCOUNT_ID"),
    accessKeyId: get("R2_ACCESS_KEY_ID"),
    secretAccessKey: get("R2_SECRET_ACCESS_KEY"),
    bucket: get("R2_BUCKET"),
  };
}

export class R2 {
  private client: S3Client;
  constructor(private cfg: R2Config) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      // R2 does not accept the default CRC32 checksum headers of recent SDKs
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  /** Returns the stored size, or null when the key does not exist. */
  async sizeOf(key: string): Promise<number | null> {
    try {
      const r = await this.client.send(new HeadObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      return r.ContentLength ?? 0;
    } catch (e) {
      const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw e;
    }
  }

  async put(key: string, body: Buffer, contentType: string, contentDisposition?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentDisposition: contentDisposition,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }
}

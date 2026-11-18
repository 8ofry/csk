import crypto from "node:crypto";
import type { StorageAdapter, StorageScope, StoredFile } from "./storage";

interface S3Config {
  endpoint: string; // e.g. https://<account>.r2.cloudflarestorage.com
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function signV4(opts: {
  method: "PUT" | "GET";
  url: URL;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  payloadHash: string;
  contentType?: string;
}): Record<string, string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "s3";

  const headers: Record<string, string> = {
    host: opts.url.host,
    "x-amz-content-sha256": opts.payloadHash,
    "x-amz-date": amzDate,
  };
  if (opts.contentType) {
    headers["content-type"] = opts.contentType;
  }

  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}\n`).join("");
  const signedHeaders = sortedKeys.join(";");

  const canonicalRequest = [
    opts.method,
    opts.url.pathname,
    opts.url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    opts.payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${opts.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${opts.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, opts.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

export class S3R2Storage implements StorageAdapter {
  private cfg: S3Config;

  constructor(cfg: S3Config) {
    this.cfg = {
      ...cfg,
      endpoint: cfg.endpoint.replace(/\/$/, ""),
    };
  }

  private objectUrl(scope: StorageScope, key: string): URL {
    return new URL(`${this.cfg.endpoint}/${this.cfg.bucket}/${scope}/${key}`);
  }

  async put(input: {
    scope: StorageScope;
    key: string;
    contentType: string;
    data: Buffer | Uint8Array;
  }): Promise<StoredFile> {
    const buffer = Buffer.isBuffer(input.data) ? input.data : Buffer.from(input.data);
    const url = this.objectUrl(input.scope, input.key);
    const headers = signV4({
      method: "PUT",
      url,
      region: this.cfg.region,
      accessKeyId: this.cfg.accessKeyId,
      secretAccessKey: this.cfg.secretAccessKey,
      payloadHash: sha256Hex(buffer),
      contentType: input.contentType,
    });

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      throw new Error(`S3/R2 upload failed (${res.status}): ${await res.text()}`);
    }

    return {
      url: `/api/v1/files/${input.scope}/${input.key}`,
      contentType: input.contentType,
      sizeBytes: buffer.byteLength,
    };
  }

  async acceptUrl({ url }: { scope: StorageScope; url: string }): Promise<StoredFile> {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      throw new Error("Only https URLs are accepted");
    }
    return { url };
  }

  async read({
    scope,
    key,
  }: {
    scope: StorageScope;
    key: string;
  }): Promise<{ data: Buffer; contentType: string } | null> {
    const url = this.objectUrl(scope, key);
    const headers = signV4({
      method: "GET",
      url,
      region: this.cfg.region,
      accessKeyId: this.cfg.accessKeyId,
      secretAccessKey: this.cfg.secretAccessKey,
      payloadHash: sha256Hex(""),
    });

    const res = await fetch(url, { method: "GET", headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`S3/R2 read failed (${res.status})`);
    }
    const arrayBuf = await res.arrayBuffer();
    return {
      data: Buffer.from(arrayBuf),
      contentType: res.headers.get("content-type") ?? "application/octet-stream",
    };
  }
}

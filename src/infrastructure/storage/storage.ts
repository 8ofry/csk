// Storage adapter interface (NFR-MNT-02). v1 shipped a URL-only adapter; phase 2
// adds local-disk persistence so generated PDFs survive restart and can be served
// via /api/v1/files/*. Production swaps in an S3/R2 impl via env config —
// callers don't change.
//
// Files like training-unit demo GIFs (FR-UNIT-03), medical PDFs (FR-MED-02),
// monthly report PDFs (FR-MR-04), and certificate PDFs flow through this interface.

import { promises as fs } from "node:fs";
import path from "node:path";
import { S3R2Storage } from "./s3-r2";

export interface StoredFile {
  url: string;
  contentType?: string;
  sizeBytes?: number;
}

export type StorageScope =
  | "training-unit"
  | "medical-document"
  | "payment-receipt"
  | "profile-photo"
  | "merchandise-photo"
  | "monthly-report"
  | "certificate";

export interface StorageAdapter {
  /** Store a binary blob and return a publicly-reachable URL. */
  put(input: {
    scope: StorageScope;
    key: string; // explicit safe filename within the scope (e.g. "abc123.pdf")
    contentType: string;
    data: Buffer | Uint8Array;
  }): Promise<StoredFile>;

  /** Validate that an externally-provided URL is acceptable for the given scope. */
  acceptUrl(input: { scope: StorageScope; url: string }): Promise<StoredFile>;

  /** Read a previously-stored file (used by the /api/v1/files route). Returns null if missing. */
  read(input: {
    scope: StorageScope;
    key: string;
  }): Promise<{ data: Buffer; contentType: string } | null>;
}

const ACCEPTED_URL_PROTOCOLS = ["https:"];
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

class LocalDiskStorage implements StorageAdapter {
  async put(input: {
    scope: StorageScope;
    key: string;
    contentType: string;
    data: Buffer | Uint8Array;
  }): Promise<StoredFile> {
    const safeKey = sanitizeKey(input.key);
    const dir = path.join(UPLOADS_ROOT, input.scope);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, safeKey);
    const buffer = Buffer.isBuffer(input.data) ? input.data : Buffer.from(input.data);
    await fs.writeFile(filePath, buffer);
    await fs.writeFile(`${filePath}.meta`, input.contentType, "utf8");
    return {
      url: `/api/v1/files/${input.scope}/${safeKey}`,
      contentType: input.contentType,
      sizeBytes: buffer.byteLength,
    };
  }

  async acceptUrl({ url }: { scope: StorageScope; url: string }): Promise<StoredFile> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Invalid URL");
    }
    if (!ACCEPTED_URL_PROTOCOLS.includes(parsed.protocol)) {
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
    const safeKey = sanitizeKey(key);
    const filePath = path.join(UPLOADS_ROOT, scope, safeKey);
    try {
      const [data, contentType] = await Promise.all([
        fs.readFile(filePath),
        fs.readFile(`${filePath}.meta`, "utf8").catch(() => "application/octet-stream"),
      ]);
      return { data, contentType: contentType.trim() };
    } catch {
      return null;
    }
  }
}

function sanitizeKey(key: string): string {
  if (key.includes("..") || key.includes("/") || key.includes("\\")) {
    throw new Error("Invalid storage key: path-traversal characters not allowed");
  }
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    throw new Error("Storage key must match [A-Za-z0-9._-]+");
  }
  return key;
}

export async function validateUploadedFile(
  file: File,
  opts: { maxBytes: number; allowPdf?: boolean },
): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  if (file.size <= 0) throw new Error("Uploaded file is empty");
  if (file.size > opts.maxBytes) {
    throw new Error(`File exceeds maximum allowed size (${Math.round(opts.maxBytes / (1024 * 1024))} MB)`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length < 4) throw new Error("Invalid file content");

  // Magic-byte sniffing (prevents SVG/HTML/JS spoofing)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { buffer, ext: "jpg", contentType: "image/jpeg" };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { buffer, ext: "png", contentType: "image/png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { buffer, ext: "webp", contentType: "image/webp" };
  }
  if (opts.allowPdf && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { buffer, ext: "pdf", contentType: "application/pdf" };
  }

  throw new Error(
    opts.allowPdf
      ? "Unsupported file type. Allowed: JPG, PNG, WebP, PDF."
      : "Unsupported image type. Allowed: JPG, PNG, WebP.",
  );
}

function createStorageAdapter(): StorageAdapter {
  const provider = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  if (provider === "r2" || provider === "s3") {
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (endpoint && bucket && accessKeyId && secretAccessKey) {
      return new S3R2Storage({
        endpoint,
        bucket,
        region: process.env.S3_REGION ?? "auto",
        accessKeyId,
        secretAccessKey,
      });
    }
  }
  return new LocalDiskStorage();
}

export const storage: StorageAdapter = createStorageAdapter();

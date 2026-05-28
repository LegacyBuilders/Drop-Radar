// POST /api/upload-url
//
// Issues a Cloudflare R2 presigned PUT URL for client-side direct uploads.
// Enforces tier quotas, MIME allowlist, and max upload size before signing.
//
// Request:  { file_name, mime, size }
// Response: { put_url, get_url, key, expires_in }
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { adminDb, requireUser, jsonResponse } from "./_admin";
import { limitsFor } from "../src/lib/tier";

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/heic",
  "video/mp4", "video/quicktime", "video/webm",
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm", "audio/flac",
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
]);

const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://cdn.dropradar.app

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return jsonResponse(res, 405, { error: "Method not allowed" });

  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    return jsonResponse(res, e.status || 401, { error: e.message });
  }

  const { file_name, mime, size } = req.body || {};
  if (!file_name || !mime || typeof size !== "number") {
    return jsonResponse(res, 400, { error: "file_name, mime, size required" });
  }
  if (!ALLOWED_MIME.has(mime)) {
    return jsonResponse(res, 415, { error: `Unsupported MIME: ${mime}` });
  }

  const { profiles } = await adminDb.query({
    profiles: { $: { where: { "$user.id": user.id } } },
  });
  const profile = profiles[0];
  if (!profile) return jsonResponse(res, 403, { error: "Profile not found" });

  const limits = limitsFor(profile.tier);

  if (size > limits.max_upload_bytes) {
    return jsonResponse(res, 413, {
      error: `File exceeds ${(limits.max_upload_bytes / 1024 / 1024).toFixed(0)}MB tier limit`,
    });
  }
  if ((profile.storage_bytes_used || 0) + size > limits.storage_bytes) {
    return jsonResponse(res, 413, { error: "Storage quota exceeded" });
  }

  const safeName = file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `drops/${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const put_url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: mime }),
    { expiresIn: 600 }
  );

  const get_url = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

  return jsonResponse(res, 200, { put_url, get_url, key, expires_in: 600 });
}

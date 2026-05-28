// Storage dispatcher. Drop Radar uses Cloudflare R2 as the single backend for
// all media (avatars, previews, audio, video, courses, zips). InstantDB only
// stores metadata. The client never PUTs through our server — it requests a
// presigned URL from /api/upload-url, then PUTs directly to R2.

const UPLOAD_URL_ENDPOINT = "/api/upload-url";

export function getFileType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

// Upload a File via R2 presigned PUT.
// Returns { url, key, size, type } on success.
export async function uploadFile(file, { token } = {}) {
  const presignRes = await fetch(UPLOAD_URL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      file_name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: presignRes.statusText }));
    throw new Error(err.error || "Failed to get upload URL");
  }

  const { put_url, get_url, key } = await presignRes.json();

  const putRes = await fetch(put_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`R2 upload failed (${putRes.status})`);
  }

  return {
    url: get_url,
    key,
    size: file.size,
    type: getFileType(file),
  };
}

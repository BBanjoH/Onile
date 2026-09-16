import { prisma } from "@/lib/db";

// Where uploaded photos and documents actually live.
//
// Two drivers, chosen automatically:
//
//   • Supabase Storage — used when SUPABASE_URL, SUPABASE_SERVICE_KEY and
//     SUPABASE_STORAGE_BUCKET are set. This is what a real deployment
//     should use: files are served straight from Supabase's CDN and never
//     touch the database.
//   • Database — the fallback, used when those aren't set. Uploads work
//     with zero configuration, which keeps local development and a small
//     launch simple. Photos are compressed on the phone before they're
//     sent (see PhotoUpload.tsx), so rows are typically 150–250KB.
//
// The upgrade path is deliberately painless: set the three variables and
// new uploads go to Supabase, while anything already stored in the
// database keeps being served from there. Nothing needs migrating.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB, before phone-side compression

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const ALLOWED_DOCUMENT_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

export type UploadKind = "PROPERTY_PHOTO" | "OWNERSHIP_DOCUMENT";

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_STORAGE_BUCKET);
}

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}

/**
 * Human-readable reason a file was rejected, or null when it's fine.
 * Returns wording suitable for showing directly to a landlord.
 */
export function rejectionReason(
  file: { size: number; type: string },
  kind: UploadKind,
): string | null {
  const allowed = kind === "OWNERSHIP_DOCUMENT" ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES;
  if (!allowed.includes(file.type)) {
    return kind === "OWNERSHIP_DOCUMENT"
      ? "Please choose a photo or a PDF file."
      : "Please choose a photo (JPG or PNG).";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "That file is too large. Please choose a smaller photo.";
  }
  if (file.size === 0) {
    return "That file seems to be empty. Please try again.";
  }
  return null;
}

async function uploadToSupabase(
  bytes: Buffer,
  mimeType: string,
  kind: UploadKind,
  id: string,
): Promise<string> {
  const baseUrl = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!;
  const path = `${kind.toLowerCase()}/${id}.${extensionFor(mimeType)}`;

  const res = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": mimeType,
      "Cache-Control": "31536000",
    },
    body: new Uint8Array(bytes),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export type StoredUpload = { id: string; url: string };

/**
 * Stores an uploaded file and returns the URL to display it at. Callers
 * should have already checked rejectionReason().
 */
export async function storeUpload(
  file: { bytes: Buffer; mimeType: string; filename: string },
  kind: UploadKind,
  uploadedById: string,
): Promise<StoredUpload> {
  const usingSupabase = isSupabaseStorageConfigured();

  const record = await prisma.storedFile.create({
    data: {
      mimeType: file.mimeType,
      byteSize: file.bytes.length,
      filename: file.filename.slice(0, 200),
      kind,
      uploadedById,
      // With Supabase the bytes live there, not here.
      data: usingSupabase ? null : file.bytes,
    },
    select: { id: true },
  });

  if (!usingSupabase) {
    return { id: record.id, url: `/api/files/${record.id}` };
  }

  try {
    const url = await uploadToSupabase(file.bytes, file.mimeType, kind, record.id);
    return { id: record.id, url };
  } catch (err) {
    // Don't leave a row pointing at a file that was never written.
    await prisma.storedFile.delete({ where: { id: record.id } }).catch(() => {});
    throw err;
  }
}

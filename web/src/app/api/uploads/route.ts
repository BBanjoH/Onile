import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rejectionReason, storeUpload, type UploadKind } from "@/lib/storage";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";

const KINDS: UploadKind[] = ["PROPERTY_PHOTO", "OWNERSHIP_DOCUMENT"];

// Receives one file from a landlord's phone. Photos arrive already
// shrunk by the browser (see PhotoUpload.tsx) — that happens on the
// device rather than here because the point is to spend less of the
// landlord's mobile data, not just less of our disk.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  // Uploads cost storage and bandwidth; keep one account from flooding us.
  const limit = rateLimit(req, "upload", { limit: 60, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimitResponse(limit);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kindRaw = String(form?.get("kind") ?? "PROPERTY_PHOTO");

  if (!form || !(file instanceof File)) {
    return NextResponse.json({ error: "No file was received. Please try again." }, { status: 400 });
  }
  if (!KINDS.includes(kindRaw as UploadKind)) {
    return NextResponse.json({ error: "Unknown upload type." }, { status: 400 });
  }
  const kind = kindRaw as UploadKind;

  const rejection = rejectionReason({ size: file.size, type: file.type }, kind);
  if (rejection) return NextResponse.json({ error: rejection }, { status: 400 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await storeUpload({ bytes, mimeType: file.type, filename: file.name }, kind, user.id);
    return NextResponse.json({ url: stored.url, id: stored.id }, { status: 201 });
  } catch (err) {
    console.error("[onile] upload failed", err);
    return NextResponse.json(
      { error: "We could not save that photo. Please check your internet and try again." },
      { status: 502 },
    );
  }
}

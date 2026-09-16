import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Serves files held by the database storage driver (see src/lib/storage.ts).
// When Supabase Storage is configured, uploads get a direct CDN URL and
// never come through here — but files stored before that switch still do,
// which is why this route stays regardless.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file || !file.data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Property photos are public — they're the whole point of a listing.
  // Ownership documents are not: a C of O or a driver's licence is only
  // ever shown to the person who uploaded it and to staff reviewing it.
  if (file.kind === "OWNERSHIP_DOCUMENT") {
    const user = await getCurrentUser();
    const allowed = !!user && (user.id === file.uploadedById || user.role === "ADMIN");
    if (!allowed) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }

  const isPrivate = file.kind === "OWNERSHIP_DOCUMENT";
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.byteSize),
      // Ids are random and content never changes, so public files can be
      // cached hard. Private ones must not be cached by any shared proxy.
      "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename || id)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

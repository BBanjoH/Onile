"use client";

import { useRef, useState } from "react";

// Taking pictures of the house is how a landlord actually has photos, so
// this is built around the phone camera first and a file picker second.
//
// Three things matter for this audience:
//   1. One obvious big button, not a drag-and-drop zone (meaningless on a
//      phone) and never a "paste an image URL" box.
//   2. The photo is shrunk on the device before it is sent. A modern phone
//      camera produces 4–8MB per shot; on Nigerian mobile data that is
//      slow and genuinely expensive. Resizing to 1280px wide brings a
//      typical photo under 250KB, which uploads in a second or two.
//   3. Plain progress and plain errors, with each photo removable.

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

/** Shrinks a photo in the browser. Non-images (PDFs) pass straight through. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // HEIC (iPhone) can't be drawn to a canvas in most browsers; send it as
  // it is and let the server keep the original.
  if (file.type.includes("heic") || file.type.includes("heif")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // If anything about resizing fails, upload the original rather than
    // blocking the landlord.
    return file;
  }
}

export type UploadedFile = { url: string; name: string };

export default function PhotoUpload({
  kind = "PROPERTY_PHOTO",
  max = 8,
  value,
  onChange,
  label = "Add photos of the property",
  hint = "Take a picture of the front, the rooms, the kitchen and the toilet.",
}: {
  kind?: "PROPERTY_PHOTO" | "OWNERSHIP_DOCUMENT";
  max?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const isDocument = kind === "OWNERSHIP_DOCUMENT";
  const full = value.length >= max;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const chosen = Array.from(fileList).slice(0, max - value.length);
    setBusy(true);
    setProgress({ done: 0, total: chosen.length });

    const uploaded: UploadedFile[] = [];
    for (const [index, original] of chosen.entries()) {
      try {
        const file = await compressImage(original);
        const body = new FormData();
        body.append("file", file);
        body.append("kind", kind);

        const res = await fetch("/api/uploads", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "That photo could not be added.");
          break;
        }
        uploaded.push({ url: data.url, name: original.name });
        setProgress({ done: index + 1, total: chosen.length });
      } catch {
        setError("No internet connection. Please check your data and try again.");
        break;
      }
    }

    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    setBusy(false);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="mb-1 font-semibold text-gray-800">{label}</p>
      <p className="mb-2 text-sm text-gray-500">{hint}</p>

      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 p-3 font-medium text-red-700">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((file, index) => (
            <li key={`${file.url}-${index}`} className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
              {file.url.endsWith(".pdf") || file.name.toLowerCase().endsWith(".pdf") ? (
                <div className="flex h-28 items-center justify-center text-4xl" aria-hidden="true">
                  📄
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={`Photo ${index + 1}`} className="h-28 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
              >
                Remove
                <span className="sr-only"> {file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={isDocument ? "image/*,application/pdf" : "image/*"}
        multiple={!isDocument}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={busy || full}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-brand-600 bg-brand-50 px-4 py-5 text-lg font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
      >
        {busy
          ? `Adding photo ${progress.done + 1} of ${progress.total}...`
          : full
            ? `You have added ${max} — that's the maximum`
            : isDocument
              ? "📄 Take a photo of the document, or choose a file"
              : value.length === 0
                ? "📷 Take a photo, or choose from your gallery"
                : "📷 Add another photo"}
      </button>

      {!busy && !full && (
        <p className="mt-1 text-sm text-gray-500">
          Photos are made smaller on your phone before sending, so this uses very little data.
        </p>
      )}
    </div>
  );
}

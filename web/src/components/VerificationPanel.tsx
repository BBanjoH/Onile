"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DOC_TYPES, DOC_TYPE_LABELS, type DocType } from "@/lib/constants";
import TrustBadge from "@/components/TrustBadge";
import PhotoUpload, { type UploadedFile } from "@/components/PhotoUpload";
import type { TrustTier } from "@/lib/verification";

type Doc = { id: string; docType: string; status: string; reviewerNote: string };

type Props = {
  propertyId: string;
  ownerPhone: string;
  ownerPhoneVerifiedAt: string | null;
  ownerCallVerifiedAt: string | null;
  trustTier: TrustTier;
  documents: Doc[];
};

export default function VerificationPanel({
  propertyId,
  ownerPhone,
  ownerPhoneVerifiedAt,
  ownerCallVerifiedAt,
  trustTier,
  documents,
}: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);

  const [docType, setDocType] = useState<DocType>("C_OF_O");
  const [fileUrl, setFileUrl] = useState("");
  const [docFile, setDocFile] = useState<UploadedFile | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);

  async function sendCode() {
    setOtpError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/verify-owner-phone/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Could not send code");
        return;
      }
      setOtpSentTo(data.sentTo);
      setDevCode(data.devCode ?? null);
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/verify-owner-phone/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Invalid code");
        return;
      }
      router.refresh();
    } catch {
      setOtpError("Something went wrong");
    }
  }

  async function submitDoc(e: React.FormEvent) {
    e.preventDefault();
    setDocError(null);
    setDocSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDocError(data.error ?? "Could not submit document");
        return;
      }
      setFileUrl("");
      setDocFile(null);
      router.refresh();
    } finally {
      setDocSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Verification</h4>
        <TrustBadge tier={trustTier} />
      </div>

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">1. Owner phone verification</p>
        {ownerPhoneVerifiedAt ? (
          <p className="mt-1 text-sm text-brand-700">✓ Verified on {new Date(ownerPhoneVerifiedAt).toLocaleDateString()}</p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500">
              Sends a one-time code by SMS to {ownerPhone || "the owner's phone"}. Works on any phone that can
              receive a text — the owner doesn&apos;t need a smartphone or to open Onile themselves; they can just
              read you the code over a call.
            </p>
            {otpError && <p className="text-sm text-red-600">{otpError}</p>}
            {!otpSentTo ? (
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || !ownerPhone}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send verification code"}
              </button>
            ) : (
              <form onSubmit={verifyCode} className="flex items-center gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                  Verify
                </button>
              </form>
            )}
            {devCode && (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                Dev mode (no SMS provider configured): the code sent was <strong>{devCode}</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">2. Confirmed by Onile phone call</p>
        {ownerCallVerifiedAt ? (
          <p className="mt-1 text-sm text-brand-700">✓ Confirmed on {new Date(ownerCallVerifiedAt).toLocaleDateString()}</p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            Done by our team, not by you — we call the owner&apos;s number directly to confirm they own the property
            and authorized this listing. Useful when the owner can&apos;t manage the OTP step themselves.
          </p>
        )}
      </div>

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">3. Ownership document</p>
        <p className="mt-1 text-xs text-gray-500">
          Certificate of Occupancy, Deed of Assignment, a recent Land Use Charge or utility bill in the owner&apos;s
          name — any one of these, reviewed by our team, earns the strongest trust badge.
        </p>

        {documents.length > 0 && (
          <ul className="mt-2 space-y-1">
            {documents.map((d) => (
              <li key={d.id} className="text-xs text-gray-600">
                <span
                  className={
                    d.status === "APPROVED" ? "text-brand-700" : d.status === "REJECTED" ? "text-red-600" : "text-gray-500"
                  }
                >
                  {DOC_TYPE_LABELS[d.docType as DocType] ?? d.docType}: {d.status}
                </span>
                {d.reviewerNote && <span className="text-gray-400"> — {d.reviewerNote}</span>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submitDoc} className="mt-2 space-y-2">
          {docError && <p className="text-sm text-red-600">{docError}</p>}
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <PhotoUpload
            kind="OWNERSHIP_DOCUMENT"
            max={1}
            value={docFile ? [docFile] : []}
            onChange={(files) => {
              setDocFile(files[0] ?? null);
              setFileUrl(files[0]?.url ?? "");
            }}
            label="The document itself"
            hint="Take a clear photo of the paper, or choose a PDF. Only you and Onile staff can see it."
          />
          <button
            type="submit"
            disabled={docSubmitting || !fileUrl}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {docSubmitting ? "Submitting..." : "Submit for review"}
          </button>
        </form>
      </div>
    </div>
  );
}

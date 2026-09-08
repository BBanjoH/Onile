"use client";

import { useEffect, useState } from "react";

const SIZES = [
  { key: "normal", label: "A", title: "Normal text size" },
  { key: "large", label: "A+", title: "Bigger text" },
  { key: "x-large", label: "A++", title: "Biggest text" },
] as const;

type SizeKey = (typeof SIZES)[number]["key"];

export const TEXT_SIZE_STORAGE_KEY = "onile_text_size";

/**
 * Lets anyone make the entire app bigger, without digging through phone
 * settings. The choice is written to <html data-text-size> (which scales
 * the root rem size in globals.css) and remembered on the device.
 */
export default function TextSizeControl() {
  const [size, setSize] = useState<SizeKey>("normal");

  useEffect(() => {
    const stored = document.documentElement.dataset.textSize as SizeKey | undefined;
    if (stored && SIZES.some((s) => s.key === stored)) setSize(stored);
  }, []);

  function apply(next: SizeKey) {
    setSize(next);
    document.documentElement.dataset.textSize = next;
    try {
      localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — the setting just won't persist.
    }
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Text size">
      {SIZES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => apply(s.key)}
          title={s.title}
          aria-pressed={size === s.key}
          className={`rounded-md border px-2 py-1 font-semibold leading-none ${
            size === s.key
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          }`}
          style={{ fontSize: s.key === "normal" ? "0.85rem" : s.key === "large" ? "0.95rem" : "1.05rem" }}
        >
          {s.label}
          <span className="sr-only"> — {s.title}</span>
        </button>
      ))}
    </div>
  );
}

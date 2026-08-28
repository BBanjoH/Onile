"use client";

export function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) {
  const stars = [1, 2, 3, 4, 5];
  const textSize = size === "sm" ? "text-sm" : "text-xl";
  return (
    <div className={`flex items-center gap-0.5 ${textSize}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={star <= Math.round(value) ? "text-amber-500" : "text-gray-300"}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

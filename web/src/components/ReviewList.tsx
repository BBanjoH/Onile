import { StarRating } from "@/components/StarRating";
import type { ReviewItem } from "@/lib/types";

export default function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        No reviews yet. Be the first to share what it&apos;s really like to live here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-md border border-gray-200 bg-white p-4">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {review.type === "COMPLAINT" ? (
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Complaint</span>
              ) : (
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Review</span>
              )}
              {review.rating != null && <StarRating value={review.rating} size="sm" />}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short" })}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900">{review.title}</h4>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{review.body}</p>
          <p className="mt-2 text-xs text-gray-500">
            — {review.author.name}
            {review.livedThere ? ", former/current tenant" : ""}
            {review.moveInYear ? ` (moved in ${review.moveInYear})` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

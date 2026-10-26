import { useState } from "react";
import { isAxiosError } from "axios";
import { useBookingReview, useCreateReview } from "../../hooks/useReviews";
import { StarDisplay, StarInput } from "./StarRating";

function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: { message?: string } }
      | undefined;
    return data?.error?.message ?? data?.message ?? "Could not save your review";
  }
  return "Could not save your review";
}

export function ReviewPrompt({ bookingId }: { bookingId: string }) {
  const { data } = useBookingReview(bookingId);
  const create = useCreateReview(bookingId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!data) return null;

  if (data.review) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Your review</h2>
        <div className="mt-2">
          <StarDisplay average={data.review.rating} count={1} showCount={false} size={18} />
        </div>
        {data.review.comment && (
          <p className="mt-2 text-sm text-slate-600">{data.review.comment}</p>
        )}
      </section>
    );
  }

  if (!data.canReview) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">How was this charger?</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your rating helps other drivers choose.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (rating === 0) return;
          create.mutate({ rating, comment: comment.trim() || undefined });
        }}
      >
        <StarInput value={rating} onChange={setRating} disabled={create.isPending} />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Add a comment (optional)"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B7A55]"
        />

        {create.isError && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage(create.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={rating === 0 || create.isPending}
          className="h-10 rounded-xl bg-[#0B7A55] px-5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {create.isPending ? "Saving..." : "Submit review"}
        </button>
      </form>
    </section>
  );
}
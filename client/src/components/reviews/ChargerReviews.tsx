import { useChargerReviews } from "../../hooks/useReviews";
import { StarDisplay } from "./StarRating";

export function ChargerReviews({ chargerId }: { chargerId: string }) {
  const { data, isLoading } = useChargerReviews(chargerId);

  if (isLoading || !data) return null;
  const { summary, reviews } = data;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Reviews</h2>
        <StarDisplay average={summary.average} count={summary.count} size={16} />
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No reviews yet. Drivers can review after they charge and pay.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {reviews.map((r) => (
            <li key={r.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{r.reviewerName}</span>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1">
                <StarDisplay average={r.rating} count={1} showCount={false} />
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
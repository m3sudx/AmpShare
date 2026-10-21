export default function VehicleSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] flex flex-col justify-between animate-pulse">
      <div>
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-slate-200 rounded-md w-16" />
            <div className="h-6 bg-slate-200 rounded-lg w-40" />
          </div>
          <div className="h-6 bg-slate-100 rounded-full w-20" />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-5" />

        {/* Specs List Skeleton */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-28" />
            <div className="h-4 bg-slate-200 rounded w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-28" />
          </div>
        </div>
      </div>

      {/* Footer Actions Skeleton */}
      <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
        <div className="h-8 bg-slate-100 rounded-xl w-20" />
        <div className="h-8 bg-slate-100 rounded-xl w-20" />
      </div>
    </div>
  );
}

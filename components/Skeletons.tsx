// Shimmer skeletons used while the deep agent streams its first results.
// Reduces perceived latency vs. the pure spinner.

export function SkeletonProfile() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <div className="space-y-3">
        <Bar width="60%" height="h-6" />
        <Bar width="35%" height="h-3" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <Bar width="50%" height="h-2.5" />
              <div className="mt-2">
                <Bar width="70%" height="h-5" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bar key={i} width="100%" height="h-10" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SkeletonReports() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <div className="space-y-3">
        <Bar width="40%" height="h-5" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Bar width="35%" height="h-4" />
            <Bar width="80%" height="h-3" />
            <Bar width="55%" height="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ width, height }: { width: string; height: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/60 ${height}`}
      style={{ width }}
    />
  );
}

type Props = {
  currentPage: number;
  totalPages: number;
  total: number;
  skip: number;
  showing: number;
  isPending?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPage: (page: number) => void;
};

export default function Pagination({
  currentPage, totalPages, total, skip, showing, isPending,
  onPrev, onNext, onPage,
}: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
      <span className="text-sm text-gray-400">
        Showing {skip + 1}–{Math.min(skip + showing, total)} of <strong className="text-gray-700">{total}</strong>
      </span>
      <div className="flex gap-1.5 items-center">
        <button
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          disabled={currentPage <= 1 || isPending}
          onClick={onPrev}
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              disabled={p === currentPage || isPending}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition ${
                p === currentPage
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              } disabled:cursor-not-allowed`}
            >
              {p}
            </button>
          )
        )}
        <button
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          disabled={currentPage >= totalPages || isPending}
          onClick={onNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

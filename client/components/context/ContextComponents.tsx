type Props = { title: string; children: React.ReactNode };

export function SectionCard({ title, children }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[15px] font-semibold text-gray-900">{title}</p>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function ContextField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-800">{label}</label>
      {children}
    </div>
  );
}

export function ContextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400"
    />
  );
}

export function ContextTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400 resize-y font-mono"
    />
  );
}

export function SaveButton({ loading, label, loadingLabel, onClick }: { loading: boolean; label: string; loadingLabel: string; onClick: () => void }) {
  return (
    <button
      disabled={loading}
      onClick={onClick}
      className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition self-start"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

type Step = { step: string; icon: string; title: string; desc: string };

export function HowItWorksSection({ steps }: { steps: Step[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-[15px] font-semibold text-gray-900">How Sentra Works</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
          Platform overview
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.step}
            className={`p-6 ${i < steps.length - 1 ? "border-r border-gray-100" : ""}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full tracking-wide">
                {s.step}
              </span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="font-semibold text-[13px] text-gray-900 mb-1.5">{s.title}</p>
            <p className="text-[12px] text-gray-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

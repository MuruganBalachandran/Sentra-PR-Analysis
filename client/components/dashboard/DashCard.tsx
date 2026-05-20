import Link from "next/link";

type Card = { href: string; icon: string; title: string; desc: string; accent: string; bg: string };

export function DashCard({ href, icon, title, desc, accent, bg }: Card) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 text-inherit no-underline"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ background: bg, color: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

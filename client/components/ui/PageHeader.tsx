type Props = { title: string; subtitle?: React.ReactNode };

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

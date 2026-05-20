type Props = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      {icon && <div className="text-5xl opacity-40">{icon}</div>}
      <p className="font-semibold text-gray-800 text-base">{title}</p>
      {description && <p className="text-sm text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

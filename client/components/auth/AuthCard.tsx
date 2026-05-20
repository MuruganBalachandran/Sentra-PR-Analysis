import Link from "next/link";
import { AIBrainLoader } from "@/components/ui/AIBrainLoader";

type Props = {
  heading: React.ReactNode;
  sub: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthCard({ heading, sub, footer, children }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: "linear-gradient(135deg, #f8f9fb 0%, #eef2ff 100%)" }}>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl w-full max-w-[400px] p-6 sm:p-9">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <AIBrainLoader size="sm" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">Sentra</span>
        </div>

        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-1.5">{heading}</h1>
        <p className="text-sm text-gray-500 mb-6">{sub}</p>

        {children}

        <p className="mt-5 text-center text-[13px] text-gray-500">{footer}</p>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: React.ReactNode;
};
export function FormField({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-800">{label}</label>
      {children}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400"
    />
  );
}

export function FormError({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
      ⚠ {msg}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-indigo-600 font-medium hover:underline">
      {children}
    </Link>
  );
}

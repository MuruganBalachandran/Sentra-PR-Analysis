import OffCanvas from "@/components/common/OffCanvas";

type User = { User_Id: string; Name: string; Email: string; Role: "ADMIN" | "USER" };

// ── Shared field ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-800">{label}</label>
      {children}
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400"
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition"
    />
  );
}

// ── Create panel ───────────────────────────────────────────────────────────
type CreateProps = {
  open: boolean;
  name: string; email: string; password: string; role: "ADMIN" | "USER";
  onName: (v: string) => void; onEmail: (v: string) => void;
  onPassword: (v: string) => void; onRole: (v: "ADMIN" | "USER") => void;
  onClose: () => void; onCreate: () => void;
};

export function CreateUserPanel({ open, name, email, password, role, onName, onEmail, onPassword, onRole, onClose, onCreate }: CreateProps) {
  return (
    <OffCanvas open={open} title="Add User" onClose={onClose}>
      <Field label="Full name"><Input placeholder="Jane Smith" value={name} onChange={(e) => onName(e.target.value)} /></Field>
      <Field label="Email address"><Input type="email" placeholder="jane@company.com" value={email} onChange={(e) => onEmail(e.target.value)} /></Field>
      <Field label="Password"><Input type="password" placeholder="••••••••" value={password} onChange={(e) => onPassword(e.target.value)} /></Field>
      <Field label="Role">
        <Select value={role} onChange={(e) => onRole(e.target.value as any)}>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </Field>
      <div className="mt-auto pt-2">
        <button onClick={onCreate} className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
          Create user
        </button>
      </div>
    </OffCanvas>
  );
}

// ── Edit panel ─────────────────────────────────────────────────────────────
type EditProps = {
  user: User | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Record<string, string>) => void;
  onChange: (u: User) => void;
};

export function EditUserPanel({ user, onClose, onUpdate, onChange }: EditProps) {
  return (
    <OffCanvas open={!!user} title="Edit User" onClose={onClose}>
      {user && (
        <>
          <Field label="Full name">
            <Input value={user.Name} onChange={(e) => onChange({ ...user, Name: e.target.value })} />
          </Field>
          <Field label="Email address">
            <Input type="email" value={user.Email} onChange={(e) => onChange({ ...user, Email: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={user.Role} onChange={(e) => onChange({ ...user, Role: e.target.value as any })}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <div className="mt-auto pt-2">
            <button
              onClick={() => onUpdate(user.User_Id, { name: user.Name, email: user.Email, role: user.Role })}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Save changes
            </button>
          </div>
        </>
      )}
    </OffCanvas>
  );
}

type Profile = { User_Id: string; Name: string; Email: string; Role: string; Created_At?: string; Updated_At?: string };

type Props = {
  profile: Profile;
  name: string;
  saving: boolean;
  onName: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400 ${props.className || ""}`}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-800">{label}</label>
      {children}
    </div>
  );
}

export function ProfileInfoForm({ profile, name, saving, onName, onSubmit }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[15px] font-semibold text-gray-900">Account Information</p>
      </div>
      <div className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => onName(e.target.value)} placeholder="Your full name" required />
          </Field>

          <Field label="Email address">
            <Input value={profile.Email} disabled className="opacity-60 cursor-not-allowed" />
            <span className="text-[11px] text-gray-400">Email address cannot be changed.</span>
          </Field>

          <Field label="Role">
            <Input value={profile.Role} disabled className="opacity-60 cursor-not-allowed" />
          </Field>

          {(profile.Created_At || profile.Updated_At) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              {profile.Created_At && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Joined on</p>
                  <p className="text-[13px] text-gray-600">{profile.Created_At}</p>
                </div>
              )}
              {profile.Updated_At && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Last updated</p>
                  <p className="text-[13px] text-gray-600">{profile.Updated_At}</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition self-start"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

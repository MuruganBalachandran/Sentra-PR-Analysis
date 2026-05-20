type Props = {
  newPwd: string; confirmPwd: string;
  showNew: boolean; showConfirm: boolean;
  pwdSaving: boolean;
  onNewPwd: (v: string) => void;
  onConfirmPwd: (v: string) => void;
  onShowNew: () => void;
  onShowConfirm: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition placeholder-gray-400"
    />
  );
}

export function ChangePasswordForm({ newPwd, confirmPwd, showNew, showConfirm, pwdSaving, onNewPwd, onConfirmPwd, onShowNew, onShowConfirm, onSubmit }: Props) {
  const match = newPwd && confirmPwd && newPwd === confirmPwd;
  const mismatch = newPwd && confirmPwd && newPwd !== confirmPwd;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[15px] font-semibold text-gray-900">Change Password</p>
      </div>
      <div className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="px-3.5 py-3 bg-indigo-50 rounded-lg text-[13px] text-indigo-800 leading-relaxed">
            💡 Choose a strong password with at least 6 characters including letters and numbers.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-800">New password</label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} placeholder="••••••••" value={newPwd} onChange={(e) => onNewPwd(e.target.value)} required style={{ paddingRight: 56 }} />
              <button type="button" onClick={onShowNew} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700 transition">
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-800">Confirm new password</label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPwd} onChange={(e) => onConfirmPwd(e.target.value)} required style={{ paddingRight: 56 }} />
              <button type="button" onClick={onShowConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700 transition">
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {mismatch && <div className="flex items-center gap-1.5 text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-1">⚠ Passwords do not match</div>}
            {match && <div className="flex items-center gap-1.5 text-[13px] text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-1">✓ Passwords match</div>}
          </div>

          <button
            type="submit"
            disabled={pwdSaving || !newPwd || !confirmPwd || newPwd !== confirmPwd}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed transition self-start"
          >
            {pwdSaving ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}

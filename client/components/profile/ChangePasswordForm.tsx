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
              <button type="button" onClick={onShowNew} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                {showNew ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-800">Confirm new password</label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPwd} onChange={(e) => onConfirmPwd(e.target.value)} required style={{ paddingRight: 56 }} />
              <button type="button" onClick={onShowConfirm} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                {showConfirm ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
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

"use client";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function Modal({
  open, title, message,
  confirmText = "Confirm", cancelText = "Cancel",
  onConfirm, onCancel,
}: Props) {
  return (
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center p-4 transition-opacity duration-150 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden transition-transform duration-200 ${open ? "scale-100" : "scale-95"}`}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <p className="text-[15px] font-bold text-gray-900">{title || ""}</p>
        </div>
        <div className="px-6 py-5 text-sm text-gray-500">{message || ""}</div>
        <div className="px-6 pb-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

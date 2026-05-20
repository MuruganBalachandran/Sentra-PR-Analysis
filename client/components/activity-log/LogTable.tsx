import { methodBadgeCls, statusBadgeCls, formatDate } from "./LogHelpers";

type Log = {
  _id: string; Log_Id: string; Email: string; URL: string;
  Status: number; IP: string; Duration: string; Activity: string;
  Created_At: string; Action?: string; Method?: string;
};

type Props = { logs: Log[]; onDelete: (id: string) => void };

export function LogTable({ logs, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {["Time", "Method / URL", "Status", "Email", "IP", "Duration", "Activity", ""].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 border-b border-gray-100 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => {
            const id = l._id || l.Log_Id;
            const method = l.Action?.split(" ")?.[0] || l.Method || "";
            return (
              <tr key={id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-400">{formatDate(l.Created_At)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {method && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold w-fit ${methodBadgeCls(method)}`}>{method}</span>
                    )}
                    <span className="font-mono text-[11px] text-gray-500 max-w-[240px] block overflow-hidden text-ellipsis whitespace-nowrap" title={l.URL}>{l.URL}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeCls(l.Status)}`}>{l.Status}</span>
                </td>
                <td className="px-4 py-3 text-[12px] text-gray-500">{l.Email || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-gray-400">{l.IP || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-gray-400 whitespace-nowrap">{l.Duration ? `${l.Duration}ms` : "—"}</td>
                <td className="px-4 py-3 text-[12px] text-gray-600">{l.Activity || "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(id)} className="px-2.5 py-1.5 text-[12px] font-medium rounded-md text-red-500 hover:bg-red-50 transition">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

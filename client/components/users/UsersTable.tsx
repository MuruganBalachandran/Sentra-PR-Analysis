type User = { User_Id: string; Name: string; Email: string; Role: "ADMIN" | "USER" };

type Props = {
  users: User[];
  onEdit: (u: User) => void;
  onToggleRole: (u: User) => void;
  onDelete: (u: User) => void;
};

export function UsersTable({ users, onEdit, onToggleRole, onDelete }: Props) {
  const formatRole = (role: string) => {
    if (role === "ADMIN") return "Admin";
    if (role === "USER") return "User";
    return role;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {["Name", "Email", "Role", "Actions"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 border-b border-gray-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.User_Id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{u.Name}</td>
              <td className="px-4 py-3 text-gray-500 text-[13px]">{u.Email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    u.Role === "ADMIN"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {formatRole(u.Role)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEdit(u)}
                    className="px-2.5 py-1.5 text-[12px] font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onToggleRole(u)}
                    className="px-2.5 py-1.5 text-[12px] font-medium rounded-md text-gray-500 hover:bg-gray-100 transition"
                  >
                    Toggle role
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    className="px-2.5 py-1.5 text-[12px] font-medium rounded-md text-red-500 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

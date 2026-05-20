export function methodBadgeCls(method: string) {
  const m = (method || "").toLowerCase();
  if (m === "get")    return "bg-blue-100 text-blue-700";
  if (m === "post")   return "bg-green-100 text-green-700";
  if (m === "patch")  return "bg-amber-100 text-amber-700";
  if (m === "delete") return "bg-red-100 text-red-700";
  if (m === "put")    return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-500";
}

export function statusBadgeCls(status: number) {
  if (status >= 500) return "bg-red-100 text-red-700";
  if (status >= 400) return "bg-red-100 text-red-700";
  if (status >= 300) return "bg-gray-100 text-gray-500";
  if (status >= 200) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-500";
}

export function formatDate(raw: string) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return raw; }
}

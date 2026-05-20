type Profile = { User_Id: string; Name: string; Email: string; Role: string; Created_At?: string; Updated_At?: string };

export function ProfileBanner({ profile, initials, name }: { profile: Profile; initials: string; name: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-6 p-6 flex items-center gap-5">
      <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 shrink-0"
        style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)" }}>
        {initials}
      </div>
      <div>
        <p className="text-[22px] font-bold text-gray-900 tracking-tight">{name || profile.Name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{profile.Email}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${profile.Role === "ADMIN" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
            {profile.Role === "ADMIN" ? "🔑 Administrator" : "👤 User"}
          </span>
          {profile.Created_At && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-normal bg-gray-100 text-gray-500">
              Member since {profile.Created_At.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

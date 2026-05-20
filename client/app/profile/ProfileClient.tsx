"use client";
import { useState } from "react";
import { axiosClient } from "@/lib/axios";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store";
import { fetchProfile } from "@/store/slices/authSlice";
import PageHeader from "@/components/ui/PageHeader";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm";
import { ChangePasswordViaEmail } from "@/components/profile/ChangePasswordViaEmail";

type Profile = { User_Id: string; Name: string; Email: string; Role: string; Created_At?: string; Updated_At?: string };

export default function ProfileClient({ profile }: { profile: Profile }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(profile.Name || "");
  const [saving, setSaving] = useState(false);

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (profile.Email?.[0] || "U").toUpperCase();

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      await axiosClient.patch(`/users/${profile.User_Id}`, { name: name.trim() });
      await dispatch(fetchProfile());
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    // left intentionally empty, unused
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="My Profile" subtitle="Manage your account information and security settings." />
      <ProfileBanner profile={profile} initials={initials} name={name} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProfileInfoForm profile={profile} name={name} saving={saving} onName={setName} onSubmit={saveProfile} />
        <ChangePasswordViaEmail email={profile.Email} userId={profile.User_Id} />
      </div>
    </div>
  );
}

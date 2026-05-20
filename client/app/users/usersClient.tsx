"use client";
import { useState } from "react";
import { axiosClient } from "@/lib/axios";
import Modal from "@/components/common/Modal";
import { toast } from "react-toastify";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { UsersTable } from "@/components/users/UsersTable";
import { CreateUserPanel, EditUserPanel } from "@/components/users/UserPanels";
import Link from "next/link";

type User = { User_Id: string; Name: string; Email: string; Role: "ADMIN" | "USER" };

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setRole("USER"); };

  const create = async () => {
    try {
      const r = await axiosClient.post("/users", { name, email, password, role });
      setUsers((prev) => [r.data?.response || r.data, ...prev]);
      resetForm(); setCreateOpen(false);
      toast.success("User created");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to create user"); }
  };

  const update = async (id: string, patch: Record<string, string>) => {
    try {
      const r = await axiosClient.patch(`/users/${id}`, patch);
      const u = r.data?.response || r.data;
      setUsers((prev) => prev.map((x) => (x.User_Id === id ? u : x)));
      setEditOpen(null);
      toast.success("User updated");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to update user"); }
  };

  const remove = async (id: string) => {
    try {
      await axiosClient.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((x) => x.User_Id !== id));
      setConfirmDelete(null);
      toast.success("User deleted");
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed to delete user"); }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage team members and their access roles." />

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-[15px] font-semibold text-gray-900">All Users</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add user
          </button>
        </div>

        {users.length === 0 ? (
          <EmptyState icon="👤" title="No users yet" description="Add the first user to get started." />
        ) : (
          <UsersTable
            users={users}
            onEdit={setEditOpen}
            onToggleRole={(u) => update(u.User_Id, { role: u.Role === "ADMIN" ? "USER" : "ADMIN" })}
            onDelete={setConfirmDelete}
          />
        )}
      </div>

      <CreateUserPanel
        open={createOpen}
        name={name} email={email} password={password} role={role}
        onName={setName} onEmail={setEmail} onPassword={setPassword} onRole={setRole}
        onClose={() => { setCreateOpen(false); resetForm(); }}
        onCreate={create}
      />
      <EditUserPanel
        user={editOpen}
        onClose={() => setEditOpen(null)}
        onUpdate={update}
        onChange={setEditOpen}
      />
      <Modal
        open={!!confirmDelete}
        title="Delete user"
        message={`Are you sure you want to delete ${confirmDelete?.Name || confirmDelete?.Email || "this user"}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => confirmDelete && remove(confirmDelete.User_Id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

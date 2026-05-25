"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/actions/superadmin";
import type { UserRole } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "superadmin", label: "Superadmin" },
  { value: "owner", label: "Owner" },
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customer" },
];

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
}

export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as UserRole;
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        toast.success("Role updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update role");
      }
    });
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="h-7 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-opacity"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value} className="bg-zinc-800">
          {r.label}
        </option>
      ))}
    </select>
  );
}

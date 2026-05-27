import { format } from "date-fns";
import { Users } from "lucide-react";
import { getAllUsers } from "@/actions/superadmin";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResetPasswordButton } from "./reset-password-button";
import { UserRoleSelect } from "./user-role-select";
import type { UserRole } from "@/types";

export const metadata = { title: "Users - Superadmin" };

const ROLE_VARIANT: Record<UserRole, "success" | "secondary" | "warning" | "outline"> = {
  superadmin: "warning",
  owner: "success",
  staff: "secondary",
  customer: "outline",
};

export default async function SuperadminUsersPage() {
  let users;
  try {
    users = await getAllUsers();
  } catch {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-red-400">Failed to load users.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {users.length} registered {users.length === 1 ? "user" : "users"}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
            <Users className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">No users yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const initials = u.full_name
                  ? u.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : u.id.slice(0, 2).toUpperCase();

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {u.avatar_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-zinc-700 text-xs text-zinc-300">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {u.full_name ?? "-"}
                          </p>
                          {u.phone && (
                            <p className="text-xs text-zinc-500">{u.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-300">
                      {u.email ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[u.role] ?? "outline"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {format(new Date(u.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <UserRoleSelect userId={u.id} currentRole={u.role} />
                        <ResetPasswordButton
                          userId={u.id}
                          userName={u.full_name ?? u.email ?? "this user"}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

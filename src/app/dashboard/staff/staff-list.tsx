"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Loader2, Users, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { createStaffMember, updateStaffMember, deleteStaffMember, toggleStaffMember } from "@/actions/staff";
import type { Staff } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const staffFormSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["owner", "staff"]),
});
type StaffFormInput = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  defaultValues?: Partial<StaffFormInput>;
  onSubmit: (fd: FormData) => Promise<void>;
  onClose: () => void;
  isEdit?: boolean;
}

function StaffForm({ defaultValues, onSubmit, onClose, isEdit }: StaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<"owner" | "staff">(defaultValues?.role ?? "staff");

  const { register, handleSubmit, formState: { errors } } = useForm<StaffFormInput>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { role: "staff", ...defaultValues },
  });

  function submit(data: StaffFormInput) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("full_name", data.full_name);
      fd.append("email", data.email ?? "");
      fd.append("role", role);
      try {
        await onSubmit(fd);
        toast.success(isEdit ? "Staff member updated" : "Staff member added");
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-zinc-300">Full name</Label>
        <Input placeholder="Jane Smith" className={inputClass} {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-zinc-300">Email (optional)</Label>
        <Input type="email" placeholder="jane@example.com" className={inputClass} {...register("email")} />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-zinc-300">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as "owner" | "staff")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button" className="border-zinc-700 text-zinc-300">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isPending} className="bg-emerald-500 text-white hover:bg-emerald-400">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save changes" : "Add member"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface StaffCardProps {
  member: Staff;
}

function StaffCard({ member }: StaffCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = member.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleStaffMember(member.id, checked);
        toast.success(checked ? "Staff member activated" : "Staff member deactivated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteStaffMember(member.id);
        toast.success("Staff member removed");
        setDeleteOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`group rounded-xl border bg-zinc-900 p-5 transition-all hover:border-zinc-700 ${
          member.is_active ? "border-zinc-800" : "border-zinc-800/50 opacity-60"
        }`}
      >
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            {member.avatar_url && <AvatarImage src={member.avatar_url} />}
            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-zinc-100 truncate">{member.full_name}</p>
              {member.role === "owner" && (
                <Badge variant="success" className="shrink-0 text-[10px] px-1.5">
                  Owner
                </Badge>
              )}
            </div>
            {member.email && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                {member.email}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditOpen(true)}
              className="text-zinc-500 hover:text-zinc-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteOpen(true)}
              className="text-zinc-500 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {member.is_active ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={member.is_active}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit staff member</DialogTitle>
            <DialogDescription>Update details for {member.full_name}.</DialogDescription>
          </DialogHeader>
          <StaffForm
            defaultValues={{ full_name: member.full_name, email: member.email ?? "", role: member.role as "owner" | "staff" }}
            onSubmit={(fd) => updateStaffMember(member.id, fd)}
            onClose={() => setEditOpen(false)}
            isEdit
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove staff member?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong className="text-zinc-100">{member.full_name}</strong> from your team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-zinc-700 text-zinc-300">Cancel</Button>
            </DialogClose>
            <Button onClick={handleDelete} disabled={isPending} className="bg-red-600 text-white hover:bg-red-500">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface StaffListProps {
  staff: Staff[];
}

export function StaffList({ staff }: StaffListProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
            <Users className="h-7 w-7 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">No staff members yet</p>
            <p className="mt-1 text-xs text-zinc-500">Add team members to assign bookings to them.</p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="mt-2 gap-2 bg-emerald-500 text-white hover:bg-emerald-400">
            <Plus className="h-4 w-4" />
            Add first member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {staff.map((member) => (
              <StaffCard key={member.id} member={member} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
            <DialogDescription>Add a new team member to your business.</DialogDescription>
          </DialogHeader>
          <StaffForm onSubmit={createStaffMember} onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

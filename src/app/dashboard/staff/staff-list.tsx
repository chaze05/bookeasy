"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Loader2, Users, Mail, CalendarDays, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  toggleStaffMember,
  saveStaffAvailability,
  addBlockedDate,
  deleteBlockedDate,
} from "@/actions/staff";
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

interface ScheduleRow {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BlockedRow {
  id: string;
  staff_id: string | null;
  blocked_on: string;
  reason: string | null;
}

type AvailabilityWindow = { day_of_week: number; start_time: string; end_time: string };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeFromIso(iso: string): string {
  return iso.length >= 16 ? iso.slice(11, 16) : "09:00";
}

function ScheduleEditor({
  memberId,
  initial,
  onDone,
}: {
  memberId: string;
  initial: ScheduleRow[];
  onDone: () => void;
}) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>(
    initial.map((row) => ({
      day_of_week: row.day_of_week,
      start_time: timeFromIso(row.start_time),
      end_time: timeFromIso(row.end_time),
    }))
  );
  const [isPending, startTransition] = useTransition();

  function update(index: number, patch: Partial<AvailabilityWindow>) {
    setWindows((prev) => prev.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }

  function save() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("windows", JSON.stringify(windows));
      try {
        await saveStaffAvailability(memberId, fd);
        toast.success("Weekly schedule saved");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save schedule");
      }
    });
  }

  const inputClass =
    "h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="flex flex-col gap-4">
      {windows.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-xs text-zinc-500">
          No working hours set. Staff without a schedule fall back to your business hours.
        </p>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
          {windows.map((window, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={window.day_of_week}
                onChange={(e) => update(index, { day_of_week: Number(e.target.value) })}
                className={`${inputClass} flex-1`}
              >
                {DAY_NAMES.map((day, value) => (
                  <option key={value} value={value} className="bg-zinc-900">
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={window.start_time}
                onChange={(e) => update(index, { start_time: e.target.value })}
                className={inputClass}
              />
              <span className="text-xs text-zinc-600">to</span>
              <input
                type="time"
                value={window.end_time}
                onChange={(e) => update(index, { end_time: e.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setWindows((prev) => prev.filter((_, i) => i !== index))}
                className="flex h-9 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setWindows((prev) => [...prev, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }])
        }
        className="inline-flex h-8 w-fit items-center gap-1 rounded-lg border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
      >
        <Plus className="h-3 w-3" /> Add hours
      </button>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button" className="border-zinc-700 text-zinc-300">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          onClick={save}
          disabled={isPending}
          className="bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save schedule"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function TimeOffCard({ staff, blockedDates }: { staff: Staff[]; blockedDates: BlockedRow[] }) {
  const [date, setDate] = useState("");
  const [staffId, setStaffId] = useState("all");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!date) {
      toast.error("Pick a date to block");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("blocked_on", date);
      fd.set("staff_id", staffId);
      fd.set("reason", reason);
      try {
        await addBlockedDate(fd);
        toast.success("Day blocked");
        setDate("");
        setReason("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to block day");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deleteBlockedDate(id);
        toast.success("Block removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove");
      }
    });
  }

  const staffName = (id: string | null) =>
    id ? (staff.find((s) => s.id === id)?.full_name ?? "Staff") : "Entire business";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <CalendarOff className="h-4 w-4 text-zinc-500" />
        <h2 className="text-sm font-semibold text-zinc-100">Days off / blocked dates</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-zinc-400">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border-zinc-700 bg-zinc-800 text-zinc-100 [color-scheme:dark] sm:w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-zinc-400">Applies to</Label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 text-sm text-zinc-100 focus:outline-none sm:w-48"
          >
            <option value="all" className="bg-zinc-800">
              Entire business
            </option>
            {staff.map((member) => (
              <option key={member.id} value={member.id} className="bg-zinc-800">
                {member.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <Label className="text-xs text-zinc-400">Reason (optional)</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Holiday, training…"
            className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <Button
          type="button"
          onClick={add}
          disabled={isPending}
          className="gap-1.5 bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Block
        </Button>
      </div>

      {blockedDates.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-800 pt-4">
          {blockedDates.map((block) => (
            <div key={block.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="font-medium text-zinc-200">{block.blocked_on.slice(0, 10)}</span>
                <span className="ml-2 text-xs text-zinc-500">{staffName(block.staff_id)}</span>
                {block.reason && <span className="ml-2 text-xs text-zinc-600">· {block.reason}</span>}
              </div>
              <button
                type="button"
                onClick={() => remove(block.id)}
                disabled={isPending}
                className="text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StaffCardProps {
  member: Staff;
  availability: ScheduleRow[];
}

function StaffCard({ member, availability }: StaffCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
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
              onClick={() => setScheduleOpen(true)}
              className="text-zinc-500 hover:text-emerald-400"
              title="Weekly schedule"
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </Button>
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

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekly schedule</DialogTitle>
            <DialogDescription>
              Working hours for {member.full_name}. Times outside these windows are not bookable.
            </DialogDescription>
          </DialogHeader>
          {scheduleOpen && (
            <ScheduleEditor
              memberId={member.id}
              initial={availability}
              onDone={() => setScheduleOpen(false)}
            />
          )}
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
  availability: {
    id: string;
    staff_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
  blockedDates: {
    id: string;
    staff_id: string | null;
    blocked_on: string;
    reason: string | null;
  }[];
}

export function StaffList({ staff, availability, blockedDates }: StaffListProps) {
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
              <StaffCard
                key={member.id}
                member={member}
                availability={availability.filter((row) => row.staff_id === member.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <TimeOffCard staff={staff} blockedDates={blockedDates} />

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

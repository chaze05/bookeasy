"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { createService, updateService, deleteService, toggleService } from "@/actions/services";
import { serviceSchema, type ServiceInput } from "@/lib/validations";
import type { Service } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const COLOR_PRESETS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
];

interface ServiceFormProps {
  defaultValues?: Partial<ServiceInput>;
  onSubmit: (data: FormData) => Promise<void>;
  onClose: () => void;
  isEdit?: boolean;
}

function ServiceForm({ defaultValues, onSubmit, onClose, isEdit }: ServiceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [color, setColor] = useState(defaultValues?.color ?? "#10b981");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { color: "#10b981", ...defaultValues },
  });

  function submit(data: ServiceInput) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries({ ...data, color }).forEach(([k, v]) =>
        fd.append(k, String(v ?? ""))
      );
      try {
        await onSubmit(fd);
        toast.success(isEdit ? "Service updated" : "Service created");
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
        <Label className="text-zinc-300">Name</Label>
        <Input placeholder="e.g. Haircut & Style" className={inputClass} {...register("name")} />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-zinc-300">Description</Label>
        <Textarea placeholder="Optional description…" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-zinc-300">Duration (minutes)</Label>
          <Input type="number" min={5} step={5} placeholder="60" className={inputClass} {...register("duration")} />
          {errors.duration && <p className="text-xs text-red-400">{errors.duration.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-zinc-300">Price ($)</Label>
          <Input type="number" min={0} step={0.01} placeholder="0.00" className={inputClass} {...register("price")} />
          {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-zinc-300">Color</Label>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-6 w-6 rounded-full ring-offset-2 ring-offset-zinc-900 transition-all"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button" className="border-zinc-700 text-zinc-300">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save changes" : "Create service"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleService(service.id, checked);
        toast.success(checked ? "Service activated" : "Service deactivated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteService(service.id);
        toast.success("Service deleted");
        setDeleteOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
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
        className={`group relative rounded-xl border bg-zinc-900 p-5 transition-all hover:border-zinc-700 ${
          service.is_active ? "border-zinc-800" : "border-zinc-800/50 opacity-60"
        }`}
      >
        {/* Color strip */}
        <div
          className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
          style={{ backgroundColor: service.color }}
        />

        <div className="pl-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-100 truncate">{service.name}</h3>
              {service.description && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{service.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditOpen(true)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-100"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteOpen(true)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {service.duration} min
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {Number(service.price).toFixed(2)}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-zinc-600">{service.is_active ? "Active" : "Inactive"}</span>
              <Switch
                checked={service.is_active}
                onCheckedChange={handleToggle}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
            <DialogDescription>Update the details for {service.name}.</DialogDescription>
          </DialogHeader>
          <ServiceForm
            defaultValues={{
              name: service.name,
              description: service.description ?? "",
              duration: service.duration,
              price: service.price,
              color: service.color,
            }}
            onSubmit={(fd) => updateService(service.id, fd)}
            onClose={() => setEditOpen(false)}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete service?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong className="text-zinc-100">{service.name}</strong>.
              Existing bookings will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-zinc-700 text-zinc-300">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ServiceListProps {
  services: Service[];
}

export function ServiceList({ services }: ServiceListProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-emerald-500 text-white hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add service
        </Button>
      </div>

      {services.length === 0 && !addOpen ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
            <Scissors className="h-7 w-7 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">No services yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Add your first service to start accepting bookings.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="mt-2 gap-2 bg-emerald-500 text-white hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Add first service
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New service</DialogTitle>
            <DialogDescription>Fill in the details to create a new service.</DialogDescription>
          </DialogHeader>
          <ServiceForm
            onSubmit={createService}
            onClose={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

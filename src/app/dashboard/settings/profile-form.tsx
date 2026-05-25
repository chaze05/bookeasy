"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { updateProfile, updatePassword } from "@/actions/profile";
import { createClient } from "@/supabase/client";
import type { Profile } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const passwordFormSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ProfileFormInput = z.infer<typeof profileFormSchema>;
type PasswordFormInput = z.infer<typeof passwordFormSchema>;

interface ProfileFormProps {
  profile: Profile | null;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [profilePending, startProfileTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();
  const [signOutPending, startSignOutTransition] = useTransition();

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    watch,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      avatar_url: profile?.avatar_url ?? "",
    },
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordFormSchema),
  });

  const avatarUrl = watch("avatar_url");
  const fullName = watch("full_name");
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  function submitProfile(data: ProfileFormInput) {
    startProfileTransition(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, String(v ?? "")));
      try {
        await updateProfile(fd);
        toast.success("Profile updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  function submitPassword(data: PasswordFormInput) {
    startPasswordTransition(async () => {
      const fd = new FormData();
      fd.append("password", data.password);
      fd.append("confirm", data.confirm);
      try {
        await updatePassword(fd);
        toast.success("Password updated");
        resetPassword();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  function handleSignOut() {
    startSignOutTransition(async () => {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  const inputClass =
    "border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

  return (
    <div className="flex flex-col gap-6">
      {/* Profile */}
      <form
        onSubmit={handleProfileSubmit(submitProfile)}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Profile</h2>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">
              {fullName || "Your name"}
            </p>
            <p className="text-xs text-zinc-500 truncate">{email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Full name</Label>
            <Input placeholder="Jane Smith" className={inputClass} {...regProfile("full_name")} />
            {profileErrors.full_name && (
              <p className="text-xs text-red-400">{profileErrors.full_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Email</Label>
            <Input value={email} disabled className="border-zinc-700 bg-zinc-800/50 text-zinc-500 cursor-not-allowed" />
            <p className="text-xs text-zinc-600">Email cannot be changed here.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Phone (optional)</Label>
            <Input type="tel" placeholder="+1 (555) 000-0000" className={inputClass} {...regProfile("phone")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Avatar URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              className={inputClass}
              {...regProfile("avatar_url")}
            />
            {profileErrors.avatar_url && (
              <p className="text-xs text-red-400">{profileErrors.avatar_url.message}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="submit"
            disabled={profilePending || !profileDirty}
            className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
          </Button>
        </div>
      </form>

      {/* Password */}
      <form
        onSubmit={handlePasswordSubmit(submitPassword)}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-100">Change Password</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">New password</Label>
            <Input type="password" placeholder="Min. 8 characters" className={inputClass} {...regPassword("password")} />
            {passwordErrors.password && (
              <p className="text-xs text-red-400">{passwordErrors.password.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-zinc-300">Confirm password</Label>
            <Input type="password" placeholder="••••••••" className={inputClass} {...regPassword("confirm")} />
            {passwordErrors.confirm && (
              <p className="text-xs text-red-400">{passwordErrors.confirm.message}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="submit"
            disabled={passwordPending}
            className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-900/40 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <LogOut className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Sign Out</h2>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          You will be redirected to the login page.
        </p>
        <Button
          onClick={handleSignOut}
          disabled={signOutPending}
          variant="outline"
          className="border-red-900/60 text-red-400 hover:bg-red-950/40 hover:text-red-300"
        >
          {signOutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign out"}
        </Button>
      </div>
    </div>
  );
}

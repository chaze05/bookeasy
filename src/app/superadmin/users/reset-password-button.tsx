"use client";

import { useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { resetUserPassword } from "@/actions/superadmin";
import { Button } from "@/components/ui/button";

interface ResetPasswordButtonProps {
  userId: string;
  userName: string;
}

export function ResetPasswordButton({ userId, userName }: ResetPasswordButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    const confirmed = window.confirm(
      `Reset ${userName}'s password? A new temporary password will be generated.`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const temporaryPassword = await resetUserPassword(userId);
        try {
          await navigator.clipboard.writeText(temporaryPassword);
        } catch {
          // Clipboard may be unavailable — the toast still shows the password.
        }
        toast.success(`New password for ${userName}: ${temporaryPassword} (copied to clipboard)`, {
          duration: 60000,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to reset password");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleReset}
      disabled={isPending}
      className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
    >
      <KeyRound className="h-3.5 w-3.5" />
      {isPending ? "Resetting" : "Reset Password"}
    </Button>
  );
}

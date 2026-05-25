"use client";

import { useTransition } from "react";
import { adminTogglePaymentType } from "@/actions/payments";

interface Props {
  type: string;
  isEnabled: boolean;
}

export function PaymentTypeToggle({ type, isEnabled }: Props) {
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => start(() => adminTogglePaymentType(type, !isEnabled))}
      disabled={pending}
      aria-label={isEnabled ? `Disable ${type}` : `Enable ${type}`}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        isEnabled ? "bg-violet-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          isEnabled ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

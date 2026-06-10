"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, CalendarCheck, ArrowLeft, TrendingUp, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${location.origin}/auth/callback?next=/dashboard/settings`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  }

  const inputClass = "border-zinc-700 bg-zinc-950/50 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 transition-all h-10";

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left Column (Form Panel) */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-5/12 lg:px-12 xl:px-24 relative z-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-sm z-10"
        >
          <div className="mb-8 flex flex-col items-center lg:items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Reset your password</h1>
              <p className="mt-1.5 text-sm text-zinc-400">We&apos;ll send you a link to get back in.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <CalendarCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-zinc-200">Email sent</h3>
                  <p className="text-sm text-zinc-400">
                    Check your email for a reset link. It may take a minute.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
                <div className="flex flex-col gap-2 mb-6">
                  <Label htmlFor="email" className="text-zinc-300 font-medium">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
                    className={inputClass} aria-invalid={!!errors.email} {...register("email")} />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting}
                  className="h-10 w-full bg-emerald-500 font-medium text-white hover:bg-emerald-400 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-500/20 rounded-xl">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6 flex justify-center lg:justify-start">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Column (Showcase Panel) - Desktop Only */}
      <div className="hidden w-7/12 flex-col items-center justify-center relative overflow-hidden bg-zinc-900 border-l border-zinc-800 lg:flex">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-900 to-zinc-950"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        {/* Floating elements */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1 }}
          className="relative z-10 w-full max-w-2xl px-12"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Manage your bookings with ease</h2>
            <p className="text-lg text-zinc-400 max-w-md mx-auto">The all-in-one platform for service businesses to scale seamlessly.</p>
          </div>

          {/* Interactive mockup grid */}
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-zinc-200">Recent Activity</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <TrendingUp className="h-3.5 w-3.5" /> +24%
                </div>
              </div>
              <div className="space-y-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-1/3 rounded-full bg-zinc-800 animate-pulse" />
                      <div className="h-2 w-1/4 rounded-full bg-zinc-800/50 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-xl"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-4">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Total Bookings</p>
              <p className="text-3xl font-bold text-white mt-1">2,481</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-xl"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit mb-4">
                <DollarSign className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">$12,450</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

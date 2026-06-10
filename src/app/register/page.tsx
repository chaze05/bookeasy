"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, CalendarCheck, TrendingUp, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterInput } from "@/lib/validations";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    router.push("/dashboard");
    router.refresh();
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
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center lg:items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Create your account</h1>
              <p className="mt-1.5 text-sm text-zinc-400">Start managing your bookings today</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5">
              <div className="flex flex-col gap-2 mb-3">
                <Label htmlFor="fullName" className="text-zinc-300 font-medium">Full name</Label>
                <Input id="fullName" type="text" placeholder="Jane Smith" autoComplete="name"
                  className={inputClass} aria-invalid={!!errors.fullName} {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
              </div>

              <div className="flex flex-col gap-2 mb-3">
                <Label htmlFor="email" className="text-zinc-300 font-medium">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email"
                  className={inputClass} aria-invalid={!!errors.email} {...register("email")} />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2 mb-3">
                <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" autoComplete="new-password"
                  className={inputClass} aria-invalid={!!errors.password} {...register("password")} />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <Label htmlFor="confirmPassword" className="text-zinc-300 font-medium">Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password"
                  className={inputClass} aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting}
                className="h-10 w-full bg-emerald-500 font-medium text-white hover:bg-emerald-400 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-500/20 rounded-xl">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-zinc-500">
              By creating an account you agree to our{" "}
              <span className="text-zinc-400">Terms of Service</span> and{" "}
              <span className="text-zinc-400">Privacy Policy</span>.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500 lg:text-left">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
          </p>
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

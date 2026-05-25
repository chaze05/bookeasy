"use client";

import { motion } from "framer-motion";

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface StaffSectionProps {
  staff: StaffMember[];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 26 },
  },
};

const avatarColors = [
  "from-violet-500/20 to-violet-600/10 ring-violet-500/20 text-violet-300",
  "from-blue-500/20 to-blue-600/10 ring-blue-500/20 text-blue-300",
  "from-amber-500/20 to-amber-600/10 ring-amber-500/20 text-amber-300",
  "from-pink-500/20 to-pink-600/10 ring-pink-500/20 text-pink-300",
  "from-emerald-500/20 to-emerald-600/10 ring-emerald-500/20 text-emerald-300",
  "from-sky-500/20 to-sky-600/10 ring-sky-500/20 text-sky-300",
  "from-rose-500/20 to-rose-600/10 ring-rose-500/20 text-rose-300",
  "from-indigo-500/20 to-indigo-600/10 ring-indigo-500/20 text-indigo-300",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StaffSection({ staff }: StaffSectionProps) {
  if (staff.length === 0) return null;

  return (
    <section id="team" className="bg-zinc-900/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
            Our Experts
          </span>
          <h2 className="mt-3 text-4xl font-bold text-zinc-100 sm:text-5xl">Meet the Team</h2>
          <p className="mt-3 text-zinc-500">
            Experienced professionals dedicated to giving you the best experience.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {staff.map((member, i) => (
            <motion.div
              key={member.id}
              variants={item}
              whileHover={{ y: -5, transition: { duration: 0.18 } }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center transition-shadow hover:border-zinc-700 hover:shadow-xl hover:shadow-black/30"
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-zinc-700"
                />
              ) : (
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${
                    avatarColors[i % avatarColors.length]
                  }`}
                >
                  <span className="text-2xl font-bold">{initials(member.full_name)}</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <p className="font-semibold text-zinc-100">{member.full_name}</p>
                <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <p className="text-xs capitalize text-zinc-500">{member.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

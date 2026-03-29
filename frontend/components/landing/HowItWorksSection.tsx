"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "1",
    title: "Connect",
    body: "Link your LeetCode account. Er. Forge syncs your full submission history."
  },
  {
    n: "2",
    title: "Analyse",
    body: "Every submission gets analysed. Not just whether you passed — but why you failed."
  },
  {
    n: "3",
    title: "Assign",
    body: "Er. Forge acts as your instructor. It assigns the exact problems that fix your gaps."
  },
  {
    n: "4",
    title: "Grow",
    body: "Track your improvement over time. Build a portfolio that proves your growth."
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[#050505] py-24">
      <div className="mx-auto w-full max-w-[1120px] px-6 text-center sm:px-10 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#3ECF8E]">How it works</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-[32px] font-medium tracking-[-1px] text-white/90 md:text-[40px]">
          Four steps to engineering clarity
        </h2>

        <div className="mx-auto mt-12 max-w-2xl">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="relative pb-12 text-center last:pb-0"
            >
              <span
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium"
                style={{
                  background: "rgba(62,207,142,0.12)",
                  border: "0.5px solid rgba(62,207,142,0.25)",
                  color: "#3ECF8E"
                }}
              >
                {s.n}
              </span>
              <h3 className="mt-4 text-[18px] font-medium text-white/90">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/50">{s.body}</p>
              {i < steps.length - 1 ? (
                <div
                  className="mx-auto mt-8 h-10 w-px"
                  style={{ background: "linear-gradient(to bottom, rgba(62,207,142,0.35), rgba(62,207,142,0.08))" }}
                  aria-hidden
                />
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

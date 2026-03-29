"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Diagnose your gaps",
    body: "Er. Forge identifies exactly which concepts you struggle with, backed by real submission evidence"
  },
  {
    title: "Get assigned, not just advised",
    body: "Not 'learn hash maps.' The exact problem to solve next, targeted to your specific weakness"
  },
  {
    title: "Prove your growth in interviews",
    body: "One shareable link showing your entire engineering journey — struggles, patterns, improvements"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-[100px] bg-transparent py-24">
      <div className="mx-auto w-full max-w-[1120px] px-6 text-center sm:px-10 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#3ECF8E]">Features</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-[32px] font-medium tracking-[-1px] text-white/90 md:text-[40px]">
          Everything you need to grow deliberately
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-5 text-center md:grid-cols-3">
          {cards.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`p-6 ${i === 1 ? "glass-panel-accent" : "glass-panel"}`}
              style={i !== 1 ? { borderTop: "2px solid rgba(62,207,142,0.4)" } : undefined}
            >
              <h3 className="text-[18px] font-medium tracking-[-0.3px] text-white/90">{c.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/50">{c.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

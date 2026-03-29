"use client";

const rows: [string, string][] = [
  ["Fix problems in the moment", "Learn why you created them"],
  ["Generic advice", "Targeted assignments"],
  ["No memory of your mistakes", "Persistent skill profile"],
  ["Solve problems for you", "Give graduated hints that build understanding"],
  ["Nothing to show interviewers", "Shareable growth portfolio"]
];

export default function DifferentiatorsSection() {
  return (
    <section className="bg-[#050505] py-24">
      <div className="mx-auto w-full max-w-[1120px] px-6 text-center sm:px-10 lg:px-12">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#3ECF8E]">Why Er. Forge</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-[32px] font-medium tracking-[-1px] text-white/90 md:text-[40px]">
          Others help you solve problems.
        </h2>
        <p
          className="mx-auto mt-2 max-w-3xl text-[22px] font-medium md:text-[26px]"
          style={{ color: "#3ECF8E" }}
        >
          Er. Forge ensures you stop creating the same ones.
        </p>

        <div
          className="mt-10 overflow-hidden rounded-[12px] text-center"
          style={{ border: "0.5px solid rgba(255,255,255,0.06)", background: "#0f0f0f" }}
        >
          <div
            className="grid grid-cols-2 gap-0 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="px-5 py-4 text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Other AI tools
            </div>
            <div className="px-5 py-4 text-[13px] text-white/90">Er. Forge</div>
          </div>
          {rows.map(([left, right]) => (
            <div
              key={left}
              className="grid grid-cols-2 gap-0 border-b last:border-b-0"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="px-5 py-4 text-[14px] leading-snug"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "line-through",
                  textDecorationColor: "rgba(255,255,255,0.15)"
                }}
              >
                {left}
              </div>
              <div className="px-5 py-4 text-[14px] leading-snug text-white/90">
                <span className="mr-2 text-[#3ECF8E]">✓</span>
                {right}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-8 rounded-[12px] px-6 py-5 text-center"
          style={{
            background: "rgba(62,207,142,0.05)",
            border: "0.5px solid rgba(62,207,142,0.15)"
          }}
        >
          <p className="text-[14px] leading-relaxed text-white/70">
            Backed by a 2026 Anthropic study showing that developers who had AI solve their problems directly scored
            significantly lower on follow-up assessments than those who worked through errors themselves.
          </p>
          <p className="mt-3 text-[12px] text-white/30">Anthropic research summary · 2026</p>
        </div>
      </div>
    </section>
  );
}

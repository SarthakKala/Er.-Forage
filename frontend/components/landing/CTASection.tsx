import Link from "next/link";

export default function CTASection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-[100px] bg-transparent py-[120px]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(62,207,142,0.1), transparent 62%)"
      }}
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 text-center sm:px-10 lg:px-12">
        <div className="glass-panel-accent mx-auto max-w-[640px] rounded-[16px] px-8 py-12 text-center shadow-[0_24px_64px_rgba(0,0,0,0.5)] md:px-12 md:py-14">
          <h2 className="text-[32px] font-medium tracking-[-1px] text-white/90 md:text-[40px]">
            Start building the portfolio that gets you hired.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Connect your LeetCode account. Er. Forge handles the rest.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full px-8 py-3.5 text-[14px] font-semibold shadow-[0_10px_40px_rgba(62,207,142,0.3)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_48px_rgba(62,207,142,0.4)]"
            style={{
              background: "linear-gradient(135deg, #4dd89f 0%, #3ECF8E 50%, #2eb87a 100%)",
              color: "#050505"
            }}
          >
            Get started free →
          </Link>
          <p className="mt-4 text-[12px] text-white/35">No credit card. No setup. Just connect LeetCode.</p>
        </div>
      </div>
    </section>
  );
}

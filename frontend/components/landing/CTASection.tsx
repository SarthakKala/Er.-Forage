import Link from "next/link";

export default function CTASection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 py-[120px]"
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(62,207,142,0.07), transparent)"
      }}
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 text-center sm:px-10 lg:px-12">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="text-[32px] font-medium tracking-[-1px] text-white/90 md:text-[40px]">
            Start building the portfolio that gets you hired.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            Connect your LeetCode account. Er. Forge handles the rest.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-[10px] px-8 py-3 text-[14px] font-semibold"
            style={{ background: "#3ECF8E", color: "#050505" }}
          >
            Get started free →
          </Link>
          <p className="mt-4 text-[12px] text-white/25">No credit card. No setup. Just connect LeetCode.</p>
        </div>
      </div>
    </section>
  );
}

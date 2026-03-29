import HeroSequence from "@/components/HeroSequence";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DifferentiatorsSection from "@/components/landing/DifferentiatorsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#050505]" aria-hidden>
        <div
          className="absolute -left-[15%] top-[-10%] h-[min(560px,80vw)] w-[min(560px,80vw)] rounded-full opacity-90 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(62,207,142,0.14) 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-[5%] right-[-8%] h-[min(440px,70vw)] w-[min(440px,70vw)] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(62,207,142,0.08) 0%, transparent 62%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 85% 65% at 50% 20%, black 0%, transparent 72%)"
          }}
        />
      </div>
      <main className="relative min-h-screen bg-transparent">
        <HeroSequence />
        <FeaturesSection />
        <HowItWorksSection />
        <DifferentiatorsSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}

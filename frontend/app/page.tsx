import HeroSequence from "@/components/HeroSequence";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DifferentiatorsSection from "@/components/landing/DifferentiatorsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <HeroSequence />
      <FeaturesSection />
      <HowItWorksSection />
      <DifferentiatorsSection />
      <CTASection />
      <Footer />
    </main>
  );
}

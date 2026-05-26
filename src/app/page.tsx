import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/pages/HeroSection";
import { FeaturesSection } from "@/components/pages/FeaturesSection";
import { StatsSection } from "@/components/pages/StatsSection";
import { TestimonialsSection } from "@/components/pages/TestimonialsSection";
import { PricingPreview } from "@/components/pages/PricingPreview";
import { CTASection } from "@/components/pages/CTASection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingPreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

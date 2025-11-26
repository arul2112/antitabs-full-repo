/**
 * Home Page - Landing Page
 */

import { HeroSection } from "../components/hero-section";
import { VideoSection } from "../components/video-section";
import { ProblemSolutionSection } from "../components/problem-solution-section";
import { FeaturesShowcase } from "../components/features-showcase";
import { HowItWorks } from "../components/how-it-works";
import { SocialProofSection } from "../components/social-proof-section";
import { PricingCTASection } from "../components/pricing-cta-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <VideoSection />
      <ProblemSolutionSection />
      <FeaturesShowcase />
      <HowItWorks />
      <SocialProofSection />
      <PricingCTASection />
    </main>
  );
}

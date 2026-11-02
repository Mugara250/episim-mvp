import { LandingNav } from '../components/landing/LandingNav';
import { LandingHero } from '../components/landing/LandingHero';
import { TrustedBy } from '../components/landing/TrustedBy';
import { FeatureBento } from '../components/landing/FeatureBento';
import { WorkflowSteps } from '../components/landing/WorkflowSteps';
import { ModulesStrip } from '../components/landing/ModulesStrip';
import { StatsBand } from '../components/landing/StatsBand';
import { LandingFooter } from '../components/landing/LandingFooter';
import { FinalCta } from '../components/landing/FinalCta';

interface LandingProps {
  onNavigate: (route: string) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen w-full bg-[#0E1729] text-white font-sans overflow-x-hidden">
      <LandingNav onNavigate={onNavigate} />
      <main>
        <LandingHero onNavigate={onNavigate} />
        <TrustedBy />
        <FeatureBento />
        <WorkflowSteps />
        <ModulesStrip />
        <StatsBand />
        <FinalCta onNavigate={onNavigate} />
      </main>
      <LandingFooter />
    </div>);

}
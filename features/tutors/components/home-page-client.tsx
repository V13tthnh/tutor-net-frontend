'use client';

import { PublicHeader } from '@/features/tutors/components/public-header';
import type { Tutor } from '@/constants/mock-api-tutors';
import PublicFooter from './public-footer';
import { CtaBannerSection } from './home/cta-banner-section';
import WhyChooseUsSection from './home/why-choose-us-section';
import TeachingModesSection from './home/teaching-modes-section';
import HowItWorksSection from './home/how-it-works-section';
import FeaturedTutorsSection from './home/featured-tutors-section';
import LevelsSection from './home/levels-section';
import SubjectsSection from './home/subjects-section';
import { StatsSection } from './home/stats-section';
import HeroSection from './home/hero-section';

interface HomePageClientProps {
  featuredTutors: Tutor[];
}

export function HomePageClient({ featuredTutors }: HomePageClientProps) {
  return (
    <div className='min-h-screen'>
      {/* ─── Header ─── */}
      <PublicHeader />

      {/* ─── Hero Section ─── */}
      <HeroSection />

      {/* ─── Stats ─── */}
      <StatsSection />

      {/* ─── Subject Filter Grid ─── */}
      {/* <SubjectsSection /> */}

      {/* ─── Level Filter ─── */}
      {/* <LevelsSection /> */}

      {/* ─── Featured Tutors ─── */}
      <FeaturedTutorsSection featuredTutors={featuredTutors} />

      {/* ─── How it works ─── */}
      <HowItWorksSection />

      {/* ─── Teaching Modes ─── */}
      <TeachingModesSection />

      {/* ─── Why Choose Us ─── */}
      <WhyChooseUsSection />

      {/* ─── CTA Banner ─── */}
      <CtaBannerSection />

      {/* ─── Footer ─── */}
      <PublicFooter />
    </div>
  );
}
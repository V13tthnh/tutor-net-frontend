'use client';

import { useState } from 'react';
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
import { TutorCvModal } from './tutor-cv-modal';
import { TutorInviteModal } from './tutor-invite-modal';
import { useQuery } from '@tanstack/react-query';
import { tutorByIdOptions } from '../api/queries';

interface HomePageClientProps {
  featuredTutors: Tutor[];
}

export function HomePageClient({ featuredTutors }: HomePageClientProps) {
  const [cvTutor, setCvTutor] = useState<Tutor | null>(null);
  const [inviteTutor, setInviteTutor] = useState<Tutor | null>(null);

  const { data: tutorDetailData, isLoading: isLoadingDetail } = useQuery({
    ...tutorByIdOptions(cvTutor?.id ?? 0),
    enabled: !!cvTutor?.id
  });

  return (
    <div className='min-h-screen'>
      {/* ─── Header ─── */}
      <PublicHeader />

      {/* ─── Hero Section ─── */}
      <HeroSection />

      {/* ─── Stats ─── */}
      <StatsSection />

      {/* ─── Featured Tutors ─── */}
      <FeaturedTutorsSection
        featuredTutors={featuredTutors}
        onContactClick={(tutor) => setCvTutor(tutor)}
        onInviteClick={(tutor) => setInviteTutor(tutor)}
      />

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

      {/* ─── Modals ─── */}
      <TutorCvModal
        tutor={cvTutor}
        tutorDetail={tutorDetailData?.tutor as any}
        open={cvTutor !== null}
        onClose={() => setCvTutor(null)}
        isLoading={isLoadingDetail}
        onInviteClick={(tutor) => {
          setCvTutor(null);
          setInviteTutor(tutor);
        }}
      />
      <TutorInviteModal
        tutor={inviteTutor}
        open={inviteTutor !== null}
        onClose={() => setInviteTutor(null)}
      />
    </div>
  );
}
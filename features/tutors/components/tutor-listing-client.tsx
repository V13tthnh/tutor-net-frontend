'use client';

import { useState } from 'react';
import { TutorFilters } from './tutor-filters';
import { TutorGrid } from './tutor-grid';
import { TutorCvModal } from './tutor-cv-modal';
import { TutorInviteModal } from './tutor-invite-modal';
import type { TutorFilters as TutorFiltersType } from '../api/types';
import type { Tutor } from '@/constants/mock-api-tutors';

interface TutorListingClientProps {
  filters: TutorFiltersType;
}

export function TutorListingClient({ filters }: TutorListingClientProps) {
  const [cvTutor, setCvTutor] = useState<Tutor | null>(null);
  const [inviteTutor, setInviteTutor] = useState<Tutor | null>(null);

  return (
    <div className='space-y-6'>
      <TutorFilters />
      <TutorGrid
        filters={filters}
        onContactClick={(tutor) => setCvTutor(tutor)}
        onInviteClick={(tutor) => setInviteTutor(tutor)}
      />
      <TutorCvModal
        tutor={cvTutor}
        open={cvTutor !== null}
        onClose={() => setCvTutor(null)}
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

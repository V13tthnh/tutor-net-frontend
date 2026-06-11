import { Metadata } from 'next';
import TutorDetailPage from '@/features/tutors/components/tutor-detail-page';
import { getTutorById } from '@/features/tutors/api/service';
import { PublicHeader } from '@/features/tutors/components/public-header';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  if (isNaN(id)) {
    return {
      title: 'Không tìm thấy gia sư'
    };
  }

  const response = await getTutorById(id);
  const tutor = response.tutor;

  if (!tutor) {
    return {
      title: 'Không tìm thấy gia sư'
    };
  }

  return {
    title: `Gia sư ${tutor.first_name} ${tutor.last_name} - TutorNet`,
    description: `Xem chi tiết hồ sơ gia sư ${tutor.first_name} ${tutor.last_name}. Dạy ${tutor.subjects.join(', ')} tại ${tutor.province}. ${tutor.bio.slice(0, 100)}...`
  };
}

export default async function TutorDetailsRoute({ params }: PageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  return (
    <div className='min-h-screen'>
      <PublicHeader />
      <TutorDetailPage id={id} />
    </div>
  );
}

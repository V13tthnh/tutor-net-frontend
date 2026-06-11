'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  IconUser, IconSchool, IconCalendar,
  IconCheck, IconUpload, IconChevronRight,
  IconLoader2, IconInfoCircle
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Import Wizard Steps Sub-components
import { StepPersonalInfo, PersonalData, Province } from './become-tutor/step-personal-info';
import { StepEducationSubjects, EducationSubjectsData, TutorSubject, SubjectNode } from './become-tutor/step-education-subjects';
import { StepAreasSchedule, AreasScheduleData } from './become-tutor/step-areas-schedule';
import { StepCertificatesConfirm, Step4Data, CertificateInput } from './become-tutor/step-certificates-confirm';
import { StatusBanner } from './become-tutor/status-banner';

const METHODS_TO_ENUM: Record<string, string> = {
  'Online': 'ONLINE',
  'Tại nhà (Offline)': 'OFFLINE',
  'Cả hai (Onlive + Offlive)': 'HYBRID',
};

const DAY_TO_INT: Record<string, number> = {
  'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6,
};

const SESSION_TO_TIME: Record<string, { startTime: string; endTime: string }> = {
  'Sáng': { startTime: '07:00:00', endTime: '12:00:00' },
  'Chiều': { startTime: '12:00:00', endTime: '17:00:00' },
  'Tối': { startTime: '17:00:00', endTime: '21:00:00' },
};

const STEPS = [
  { id: 1, label: 'Thông tin cá nhân', icon: <IconUser size={16} /> },
  { id: 2, label: 'Chuyên môn & Dạy học', icon: <IconSchool size={16} /> },
  { id: 3, label: 'Khu vực & Lịch dạy', icon: <IconCalendar size={16} /> },
  { id: 4, label: 'Hồ sơ & Xác nhận', icon: <IconUpload size={16} /> },
];


export default function BecomeTutorPage() {
  const { user, loading: authLoading } = useAuthSession();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingTutorProfile, setLoadingTutorProfile] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string>('DRAFT');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Global state for options to share across components
  const [subjectTree, setSubjectTree] = useState<SubjectNode[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  // Validity state for the current active wizard step
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  // Render trigger to refresh child initialData when backend fetches complete
  const [, setRenderTrigger] = useState(0);

  // Master Ref to store all step inputs without triggering parent re-renders on every keystroke
  const becomeTutorDataRef = useRef({
    personal: {
      name: '',
      phone: '',
      email: '',
      gender: '',
      birthYear: '',
      hometownProvinceCode: '',
      hometownProvinceName: '',
      addressProvinceCode: '',
      addressProvinceName: '',
      addressDistrictCode: '',
      addressDistrictName: '',
      addressDetail: '',
      avatarUrl: '',
    } as PersonalData,
    educationSubjects: {
      headline: '',
      bio: '',
      educationLevel: '',
      experienceYears: '',
      occupation: '',
      studentYear: '',
      major: '',
      university: '',
      graduationYear: '',
      tutorSubjects: [] as TutorSubject[],
      achievements: '',
    } as EducationSubjectsData,
    areasSchedule: {
      methods: [] as string[],
      teachingProvinceCode: '',
      teachingProvinceName: '',
      teachingDistrictCode: '',
      teachingDistrictName: '',
      schedule: {} as Record<string, string[]>,
    } as AreasScheduleData,
    certificatesConfirm: {
      avatarImage: null as File | null,
      avatarUrl: '',
      studentCardImage: null as File | null,
      studentCardUrl: '',
      certificates: [{ id: '1', name: '', file: null }] as CertificateInput[],
      agreed: false,
    } as Step4Data,
  });

  // Fetch basic user profile on mount
  useEffect(() => {
    const currentUser = user;
    if (!currentUser || !currentUser.id) return;

    const loadUserProfile = async () => {
      setLoadingProfile(true);
      try {
        let data: any = null;
        try {
          const res = await apiClient<{ success: boolean; data: any }>(`/users/${currentUser.id}`);
          if (res.success && res.data) {
            data = res.data;
          }
        } catch (e) {
          console.log('GET /users/{id} failed in become tutor page, trying profile...', e);
          try {
            const res = await apiClient<{ success: boolean; data: any }>(`/users/${currentUser.id}/profile`);
            if (res.success && res.data) {
              data = res.data;
            }
          } catch (e2) {
            console.error('Both profile endpoints failed in become tutor page', e2);
          }
        }

        const genderMap: Record<string, string> = {
          'MALE': 'Nam',
          'FEMALE': 'Nữ',
          'OTHER': 'Khác',
        };

        if (data) {
          const loadedAvatar = data.avatarUrl || currentUser.avatarUrl || '';
          becomeTutorDataRef.current.personal = {
            ...becomeTutorDataRef.current.personal,
            name: data.fullName || currentUser.fullName || '',
            email: currentUser.email || '',
            phone: data.phone || '',
            gender: data.gender ? (genderMap[data.gender] || '') : '',
            birthYear: data.birthYear ? String(data.birthYear) : '',
            addressProvinceName: data.province || '',
            addressDistrictName: data.ward || '',
            addressDetail: data.address || '',
            avatarUrl: loadedAvatar,
            hometownProvinceName: data.hometownProvince || '',
          };
          becomeTutorDataRef.current.certificatesConfirm.avatarUrl = loadedAvatar || becomeTutorDataRef.current.certificatesConfirm.avatarUrl;
        } else {
          const loadedAvatar = currentUser.avatarUrl || '';
          becomeTutorDataRef.current.personal = {
            ...becomeTutorDataRef.current.personal,
            name: currentUser.fullName || '',
            email: currentUser.email || '',
            avatarUrl: loadedAvatar,
          };
          becomeTutorDataRef.current.certificatesConfirm.avatarUrl = loadedAvatar || becomeTutorDataRef.current.certificatesConfirm.avatarUrl;
        }
        setRenderTrigger(prev => prev + 1);
      } catch (err) {
        console.error('Error loading profile in become tutor page:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Fetch tutor draft profile on mount to pre-populate inputs
  useEffect(() => {
    const currentUser = user;
    if (!currentUser || !currentUser.id) return;

    const loadTutorProfile = async () => {
      setLoadingTutorProfile(true);
      try {
        const res = await apiClient<any>('/tutor/profile/me');
        const profileData = res?.data || res;
        if (profileData && (profileData.id || profileData.headline)) {
          setHasProfile(true);
          setProfileStatus(profileData.status || 'DRAFT');
          setRejectionReason(profileData.rejectionReason || null);

          // Populate step 2 data
          becomeTutorDataRef.current.educationSubjects = {
            headline: profileData.headline || '',
            bio: profileData.bio || '',
            educationLevel: profileData.educationLevel || '',
            experienceYears: profileData.experienceYears ? profileData.experienceYears.toString() : '',
            occupation: profileData.occupation || '',
            studentYear: profileData.studentYear ? `Năm ${profileData.studentYear}` : '',
            major: profileData.major || '',
            university: profileData.university || '',
            graduationYear: profileData.graduationYear ? profileData.graduationYear.toString() : '',
            achievements: profileData.achievements || '',
            tutorSubjects: Array.isArray(profileData.subjects)
              ? profileData.subjects.map((s: any) => ({
                id: s.subjectId,
                name: s.subjectName,
                hourlyRate: s.hourlyRate ? s.hourlyRate.toString() : '',
                proficiencyLevel: s.proficiencyLevel || 'INTERMEDIATE',
              }))
              : [],
          };

          // Populate step 3 data
          let fetchedMethods: string[] = [];
          const ENUM_TO_METHODS: Record<string, string> = {
            'ONLINE': 'Online',
            'OFFLINE': 'Tại nhà (Offline)',
            'HYBRID': 'Cả hai (Onlive + Offlive)',
          };
          const rawMode = profileData.teachingMode || (profileData.teachingModes && profileData.teachingModes.length > 0 ? profileData.teachingModes[0] : null);
          if (rawMode) {
            if (Array.isArray(rawMode)) {
              fetchedMethods = rawMode.map((m: string) => ENUM_TO_METHODS[m]).filter(Boolean);
            } else if (typeof rawMode === 'string') {
              const mapped = ENUM_TO_METHODS[rawMode];
              if (mapped) {
                fetchedMethods = [mapped];
              }
            }
          } else if (Array.isArray(profileData.teachingModes)) {
            fetchedMethods = profileData.teachingModes.map((m: string) => ENUM_TO_METHODS[m]).filter(Boolean);
          }

          let fetchedProvince = '';
          let fetchedDistrict = '';
          if (profileData.teachingAreas && Array.isArray(profileData.teachingAreas) && profileData.teachingAreas.length > 0) {
            fetchedProvince = profileData.teachingAreas[0].province || '';
            fetchedDistrict = profileData.teachingAreas[0].ward || '';
          } else {
            fetchedProvince = profileData.teachingProvince || '';
            fetchedDistrict = profileData.teachingWard || '';
          }

          const newSchedule: Record<string, string[]> = {};
          if (profileData.availability && Array.isArray(profileData.availability)) {
            const INT_TO_DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            profileData.availability.forEach((slot: any) => {
              const day = INT_TO_DAY[slot.dayOfWeek];
              if (!day) return;
              if (!newSchedule[day]) newSchedule[day] = [];
              const start = slot.startTime || '';
              let matchedSession = '';
              if (start.startsWith('07:')) matchedSession = 'Sáng';
              else if (start.startsWith('12:')) matchedSession = 'Chiều';
              else if (start.startsWith('17:')) matchedSession = 'Tối';

              if (matchedSession && !newSchedule[day].includes(matchedSession)) {
                newSchedule[day].push(matchedSession);
              }
            });
          }

          becomeTutorDataRef.current.areasSchedule = {
            methods: fetchedMethods,
            teachingProvinceCode: '',
            teachingProvinceName: fetchedProvince,
            teachingDistrictCode: '',
            teachingDistrictName: fetchedDistrict,
            schedule: newSchedule,
          };

          // Populate step 4 data
          becomeTutorDataRef.current.certificatesConfirm = {
            avatarImage: null,
            avatarUrl: becomeTutorDataRef.current.certificatesConfirm.avatarUrl || becomeTutorDataRef.current.personal.avatarUrl || '',
            studentCardImage: null,
            studentCardUrl: profileData.idCardFrontUrl || '',
            certificates: Array.isArray(profileData.certificates) && profileData.certificates.length > 0
              ? profileData.certificates.map((c: any) => ({
                id: c.id.toString(),
                name: c.name,
                file: null,
                previewUrl: c.fileUrl
              }))
              : [{ id: '1', name: '', file: null }],
            agreed: false,
          };

          // Sync values back to step 1 ref
          becomeTutorDataRef.current.personal = {
            ...becomeTutorDataRef.current.personal,
            hometownProvinceName: profileData.hometownProvince || becomeTutorDataRef.current.personal.hometownProvinceName,
            addressProvinceName: profileData.province || becomeTutorDataRef.current.personal.addressProvinceName,
            addressDistrictName: profileData.ward || becomeTutorDataRef.current.personal.addressDistrictName,
            addressDetail: profileData.address || becomeTutorDataRef.current.personal.addressDetail,
          };

          setRenderTrigger(prev => prev + 1);
        }
      } catch (err: any) {
        const errMsg = err?.message || '';
        if (errMsg.includes('không tồn tại') || errMsg.includes('404')) {
          console.log('Chưa có hồ sơ gia sư nháp (bắt đầu tạo mới).');
        } else {
          console.error('Lỗi khi tải hồ sơ gia sư nháp:', err);
        }
      } finally {
        setLoadingTutorProfile(false);
      }
    };

    loadTutorProfile();
  }, [user]);

  // Fetch subjects tree on mount
  useEffect(() => {
    const fetchSubjectTree = async () => {
      setLoadingSubjects(true);
      try {
        const data = await apiClient<any>('/subjects/tree');
        if (Array.isArray(data)) {
          setSubjectTree(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          setSubjectTree(data.data);
        } else {
          setSubjectTree([]);
        }
      } catch (err) {
        console.error('Error fetching subjects tree:', err);
        setSubjectTree([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjectTree();
  }, []);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch('/api/provinces');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProvinces(data);
          } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
            setProvinces(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Step change handlers
  const handleStep1Change = useCallback((data: PersonalData) => {
    becomeTutorDataRef.current.personal = data;
  }, []);

  const handleStep2Change = useCallback((data: EducationSubjectsData) => {
    becomeTutorDataRef.current.educationSubjects = data;
  }, []);

  const handleStep3Change = useCallback((data: AreasScheduleData) => {
    becomeTutorDataRef.current.areasSchedule = data;
  }, []);

  const handleStep4Change = useCallback((data: Step4Data) => {
    becomeTutorDataRef.current.certificatesConfirm = data;
    becomeTutorDataRef.current.personal.avatarUrl = data.avatarUrl;
  }, []);

  const handleNextStep = () => {
    setIsCurrentStepValid(false);
    setStep(s => (s + 1) as typeof step);
  };

  const handlePrevStep = () => {
    setIsCurrentStepValid(false);
    setStep(s => (s - 1) as typeof step);
  };

  // Save Draft Form Handler
  const handleSaveDraft = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("Vui lòng đăng nhập để lưu nháp.");
      return;
    }
    setLoading(true);
    try {
      const { personal, educationSubjects, areasSchedule, certificatesConfirm } = becomeTutorDataRef.current;

      // ── Bước 0: Cập nhật thông tin cá nhân của User ───────────────────────
      const birthYearInt = personal.birthYear ? parseInt(personal.birthYear, 10) : null;
      const userProfilePayload = {
        fullName: personal.name.trim(),
        phone: personal.phone ? personal.phone.trim() : '',
        province: personal.addressProvinceName,
        ward: personal.addressDistrictName,
        address: personal.addressDetail.trim(),
        gender: personal.gender === 'Nam' ? 'MALE' : personal.gender === 'Nữ' ? 'FEMALE' : 'OTHER',
        birthYear: birthYearInt,
        hometownProvince: personal.hometownProvinceName,
      };

      await apiClient(`/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(userProfilePayload),
      });

      // ── Bước 1: Upload Avatar & Student Card ─────────────────────────────
      let avatarUrl = certificatesConfirm.avatarUrl || '';
      let studentCardUrl = certificatesConfirm.studentCardUrl || '';

      if (certificatesConfirm.avatarImage) {
        const fd = new FormData();
        fd.append('file', certificatesConfirm.avatarImage);
        const res = await apiClient<{ success: boolean; data: { url: string } }>('/upload/avatar', {
          method: 'POST', body: fd,
        });
        if (res.success) {
          avatarUrl = res.data.url;
          becomeTutorDataRef.current.certificatesConfirm.avatarUrl = avatarUrl;
          becomeTutorDataRef.current.personal.avatarUrl = avatarUrl;
        }
      }

      if (certificatesConfirm.studentCardImage) {
        const fd = new FormData();
        fd.append('file', certificatesConfirm.studentCardImage);
        const res = await apiClient<{ success: boolean; data: { url: string } }>('/upload/avatar', {
          method: 'POST', body: fd,
        });
        if (res.success) {
          studentCardUrl = res.data.url;
          becomeTutorDataRef.current.certificatesConfirm.studentCardUrl = studentCardUrl;
        }
      }

      // ── Bước 2: Tạo hoặc Cập nhật TutorProfile (DRAFT) ───────────────────
      const studentYearInt = educationSubjects.occupation === 'Sinh viên' && educationSubjects.studentYear
        ? parseInt(educationSubjects.studentYear.replace('Năm ', ''), 10)
        : null;

      const profilePayload = {
        headline: educationSubjects.headline.trim(),
        bio: educationSubjects.bio.trim(),
        educationLevel: educationSubjects.educationLevel || null,
        experienceYears: educationSubjects.experienceYears ? parseInt(educationSubjects.experienceYears, 10) : 0,
        isAvailable: true,
        teachingMode: areasSchedule.methods.length > 0 ? METHODS_TO_ENUM[areasSchedule.methods[0]] : null,
        occupation: educationSubjects.occupation || null,
        studentYear: studentYearInt,
        major: educationSubjects.occupation === 'Sinh viên' ? educationSubjects.major.trim() || null : null,
        university: educationSubjects.university.trim() || null,
        graduationYear: educationSubjects.graduationYear ? parseInt(educationSubjects.graduationYear, 10) : null,
        achievements: educationSubjects.achievements.trim(),
        avatarUrl: avatarUrl || null,
        idCardFrontUrl: studentCardUrl || null,
        teachingProvince: areasSchedule.teachingProvinceName || null,
        teachingWard: areasSchedule.teachingDistrictName || null,
      };

      const method = hasProfile ? 'PATCH' : 'POST';
      const profileRes = await apiClient<any>('/tutor/profile', {
        method,
        body: JSON.stringify(profilePayload),
      });

      const profileDataRes = profileRes?.data || profileRes;
      if (!hasProfile && profileDataRes?.id) {
        setHasProfile(true);
      }

      // ── Bước 3: Thêm từng môn dạy ────────────────────────────────────────
      if (!isCriticalReadOnly) {
        for (const sub of educationSubjects.tutorSubjects) {
          try {
            await apiClient('/tutor/profile/subjects', {
              method: 'POST',
              body: JSON.stringify({
                subjectId: sub.id,
                proficiencyLevel: sub.proficiencyLevel,
                hourlyRate: Number(sub.hourlyRate),
              }),
            });
          } catch (e) {
            console.log(`Môn học ${sub.name} đã tồn tại hoặc lỗi, bỏ qua:`, e);
          }
        }
      }

      // ── Bước 4: Gửi lịch rảnh ───────────────────────────────────────────
      const availabilityRequests: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
      for (const [day, sessions] of Object.entries(areasSchedule.schedule)) {
        const dayOfWeek = DAY_TO_INT[day];
        if (dayOfWeek === undefined) continue;
        for (const session of (sessions ?? [])) {
          const times = SESSION_TO_TIME[session];
          if (times) availabilityRequests.push({ dayOfWeek, ...times });
        }
      }
      if (availabilityRequests.length > 0) {
        await apiClient('/tutor/profile/availability', {
          method: 'PUT',
          body: JSON.stringify(availabilityRequests),
        });
      }

      // ── Bước 5: Upload chứng chỉ ─────────────────────────────────────────
      for (const cert of certificatesConfirm.certificates) {
        if (!cert.name.trim() || !cert.file) continue;
        const uploadEndpoint = '/upload/document';
        const fd = new FormData();
        fd.append('file', cert.file);
        const uploadRes = await apiClient<{ success: boolean; data: { url: string } }>(uploadEndpoint, {
          method: 'POST', body: fd,
        });
        if (uploadRes.success) {
          const params = new URLSearchParams({
            name: cert.name.trim(),
            fileUrl: uploadRes.data.url,
          });
          await apiClient(`/tutor/profile/certificates?${params.toString()}`, {
            method: 'POST',
          });
        }
      }

      toast.success("Đã lưu nháp hồ sơ thành công!");
      window.dispatchEvent(new Event('auth-session-update'));
    } catch (err: any) {
      console.error('Lỗi khi lưu nháp hồ sơ gia sư:', err);
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu nháp. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Form Handler
  const handleSubmit = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("Vui lòng đăng nhập để nộp hồ sơ.");
      return;
    }
    setLoading(true);
    try {
      const { personal, educationSubjects, areasSchedule, certificatesConfirm } = becomeTutorDataRef.current;

      // ── Bước 0: Cập nhật thông tin cá nhân của User ───────────────────────
      const birthYearInt = personal.birthYear ? parseInt(personal.birthYear, 10) : null;
      const userProfilePayload = {
        fullName: personal.name.trim(),
        phone: personal.phone ? personal.phone.trim() : '',
        province: personal.addressProvinceName,
        ward: personal.addressDistrictName,
        address: personal.addressDetail.trim(),
        gender: personal.gender === 'Nam' ? 'MALE' : personal.gender === 'Nữ' ? 'FEMALE' : 'OTHER',
        birthYear: birthYearInt,
        hometownProvince: personal.hometownProvinceName,
      };

      await apiClient(`/users/${userId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(userProfilePayload),
      });

      // ── Bước 1: Upload Avatar & Student Card ─────────────────────────────
      let avatarUrl = certificatesConfirm.avatarUrl || '';
      let studentCardUrl = certificatesConfirm.studentCardUrl || '';

      if (certificatesConfirm.avatarImage) {
        const fd = new FormData();
        fd.append('file', certificatesConfirm.avatarImage);
        const res = await apiClient<{ success: boolean; data: { url: string } }>('/upload/avatar', {
          method: 'POST', body: fd,
        });
        if (res.success) {
          avatarUrl = res.data.url;
          becomeTutorDataRef.current.certificatesConfirm.avatarUrl = avatarUrl;
          becomeTutorDataRef.current.personal.avatarUrl = avatarUrl;
        } else {
          throw new Error('Upload ảnh đại diện thất bại');
        }
      }

      if (certificatesConfirm.studentCardImage) {
        const fd = new FormData();
        fd.append('file', certificatesConfirm.studentCardImage);
        const res = await apiClient<{ success: boolean; data: { url: string } }>('/upload/avatar', {
          method: 'POST', body: fd,
        });
        if (res.success) {
          studentCardUrl = res.data.url;
          becomeTutorDataRef.current.certificatesConfirm.studentCardUrl = studentCardUrl;
        } else {
          throw new Error('Upload ảnh thẻ sinh viên thất bại');
        }
      }

      // ── Bước 2: Tạo hoặc Cập nhật TutorProfile (DRAFT) ───────────────────
      const studentYearInt = educationSubjects.occupation === 'Sinh viên' && educationSubjects.studentYear
        ? parseInt(educationSubjects.studentYear.replace('Năm ', ''), 10)
        : null;

      const profilePayload = {
        headline: educationSubjects.headline.trim(),
        bio: educationSubjects.bio.trim(),
        educationLevel: educationSubjects.educationLevel || null,
        experienceYears: educationSubjects.experienceYears ? parseInt(educationSubjects.experienceYears, 10) : 0,
        isAvailable: true,
        teachingMode: areasSchedule.methods.length > 0 ? METHODS_TO_ENUM[areasSchedule.methods[0]] : null,
        occupation: educationSubjects.occupation || null,
        studentYear: studentYearInt,
        major: educationSubjects.occupation === 'Sinh viên' ? educationSubjects.major.trim() || null : null,
        university: educationSubjects.university.trim() || null,
        graduationYear: educationSubjects.graduationYear ? parseInt(educationSubjects.graduationYear, 10) : null,
        achievements: educationSubjects.achievements.trim(),
        avatarUrl: avatarUrl || null,
        idCardFrontUrl: studentCardUrl || null,
        idCardBackUrl: null,
        teachingProvince: areasSchedule.teachingProvinceName || null,
        teachingWard: areasSchedule.teachingDistrictName || null,
      };

      const method = hasProfile ? 'PATCH' : 'POST';
      const profileRes = await apiClient<any>('/tutor/profile', {
        method,
        body: JSON.stringify(profilePayload),
      });

      const profileDataRes = profileRes?.data || profileRes;
      if (!profileDataRes?.id) throw new Error('Tạo/Cập nhật hồ sơ thất bại — không có ID được trả về');
      if (!hasProfile && profileDataRes.id) {
        setHasProfile(true);
      }

      // ── Bước 3: Thêm từng môn dạy ────────────────────────────────────────
      for (const sub of educationSubjects.tutorSubjects) {
        try {
          await apiClient('/tutor/profile/subjects', {
            method: 'POST',
            body: JSON.stringify({
              subjectId: sub.id,
              proficiencyLevel: sub.proficiencyLevel,
              hourlyRate: Number(sub.hourlyRate),
            }),
          });
        } catch (e) {
          console.log(`Môn học ${sub.name} đã tồn tại hoặc lỗi, bỏ qua:`, e);
        }
      }

      // ── Bước 4: Gửi lịch rảnh ───────────────────────────────────────────
      const availabilityRequests: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
      for (const [day, sessions] of Object.entries(areasSchedule.schedule)) {
        const dayOfWeek = DAY_TO_INT[day];
        if (dayOfWeek === undefined) continue;
        for (const session of (sessions ?? [])) {
          const times = SESSION_TO_TIME[session];
          if (times) availabilityRequests.push({ dayOfWeek, ...times });
        }
      }
      if (availabilityRequests.length > 0) {
        await apiClient('/tutor/profile/availability', {
          method: 'PUT',
          body: JSON.stringify(availabilityRequests),
        });
      }

      // ── Bước 5: Upload chứng chỉ ─────────────────────────────────────────
      for (const cert of certificatesConfirm.certificates) {
        if (!cert.name.trim() || !cert.file) continue;
        const uploadEndpoint = '/upload/document';
        const fd = new FormData();
        fd.append('file', cert.file);
        const uploadRes = await apiClient<{ success: boolean; data: { url: string } }>(uploadEndpoint, {
          method: 'POST', body: fd,
        });
        if (uploadRes.success) {
          const params = new URLSearchParams({
            name: cert.name.trim(),
            fileUrl: uploadRes.data.url,
          });
          await apiClient(`/tutor/profile/certificates?${params.toString()}`, {
            method: 'POST',
          });
        }
      }

      // Nếu REJECTED: gọi /tutor/profile/resubmit
      // Nếu DRAFT: gọi /tutor/profile/submit
      // Nếu APPROVED: không gọi submit, chỉ thông báo thành công
      if (profileStatus === 'REJECTED') {
        await apiClient('/tutor/profile/resubmit', { method: 'POST' });
        toast.success("Nộp lại hồ sơ thành công! Vui lòng chờ ban quản trị phê duyệt.");
        setSubmitted(true);
      } else if (profileStatus === 'DRAFT') {
        await apiClient('/tutor/profile/submit', { method: 'POST' });
        toast.success("Nộp hồ sơ thành công! Vui lòng chờ ban quản trị phê duyệt.");
        setSubmitted(true);
      } else if (profileStatus === 'APPROVED') {
        // Hồ sơ đã APPROVED từ trước: các bước PATCH data phía trên đã lưu xong,
        // chỉ cần đóng Modal xác nhận và báo thành công, giữ họ lại trang form.
        toast.success("Cập nhật thông tin hồ sơ gia sư thành công!");
        setIsConfirmOpen(false);
      } else {
        // Xử lý phòng hờ cho các trạng thái khác nếu có (ví dụ: PENDING_REVIEW, SUSPENDED...)
        toast.success("Cập nhật thông tin thành công!");
        setIsConfirmOpen(false);
      }

      window.dispatchEvent(new Event('auth-session-update'));
    } catch (err: any) {
      console.error('Lỗi khi gửi hồ sơ gia sư:', err);
      toast.error(err?.message || 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Determine read-only mode based on tutor profile approval status
  // const isReadOnly = useMemo(() => {
  //   return hasProfile && profileStatus !== 'DRAFT' && profileStatus !== 'REJECTED';
  // }, [hasProfile, profileStatus]);

  // Xác định quyền sửa Dữ liệu Định danh (Bằng cấp, Môn học, Ảnh)
  // Bị khóa khi: Đã duyệt (APPROVED), Chờ duyệt (PENDING_REVIEW), Đình chỉ (SUSPENDED)
  const isCriticalReadOnly = useMemo(() => {
    return hasProfile && (profileStatus === 'APPROVED' || profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED');
  }, [hasProfile, profileStatus]);

  // Xác định quyền sửa Dữ liệu Linh hoạt (Bio, Lịch rảnh, Khu vực)
  // Bị khóa khi: Chờ duyệt (PENDING_REVIEW), Đình chỉ (SUSPENDED)
  const isFlexibleReadOnly = useMemo(() => {
    return hasProfile && (profileStatus === 'PENDING_REVIEW' || profileStatus === 'SUSPENDED');
  }, [hasProfile, profileStatus]);

  if (submitted) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-350'>
        <div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20 shadow-inner'>
          <IconCheck size={40} className='text-primary animate-bounce' />
        </div>
        <h2 className='text-2xl font-bold text-foreground'>Đăng ký ứng tuyển thành công!</h2>
        <p className='mt-2 text-muted-foreground max-w-md text-sm leading-relaxed'>
          Hồ sơ gia sư của bạn đã được gửi đến ban quản trị TutorNet. Chúng tôi sẽ xem xét, đối soát bằng cấp chứng chỉ của bạn và phản hồi kết quả duyệt hồ sơ qua email trong vòng 1–3 ngày làm việc.
        </p>
        <div className='mt-6 flex gap-3'>
          <Button onClick={() => window.location.href = '/'}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  if (authLoading || loadingProfile || loadingTutorProfile || loadingSubjects || loadingProvinces) {
    return (
      <div className='flex items-center justify-center py-20'>
        <IconLoader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2 text-sm text-muted-foreground'>Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Progress steps banner */}
      <div className='rounded-2xl border bg-card shadow-sm p-5'>
        <div className='flex items-center justify-between'>
          {STEPS.map((s, idx) => (
            <div key={s.id} className='flex flex-1 items-center'>
              <div className='flex flex-col items-center gap-1.5'>
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm transition-all duration-300',
                  step > s.id ? 'bg-primary border-primary text-primary-foreground'
                    : step === s.id ? 'border-primary text-primary shadow-md ring-2 ring-primary/10'
                      : 'border-border text-muted-foreground'
                )}>
                  {step > s.id ? <IconCheck size={16} /> : s.icon}
                </div>
                <span className={cn('text-[11px] text-center hidden sm:block font-medium',
                  step >= s.id ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2 mb-5 sm:mb-5 transition-all duration-300',
                  step > s.id ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Banner */}
      {hasProfile && profileStatus !== 'DRAFT' && (
        <StatusBanner
          status={profileStatus as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'}
          rejectionReason={rejectionReason}
          onResubmitClick={() => setIsResubmitting(true)}
        />
      )}

      {/* Step Components */}
      {step === 1 && (
        <StepPersonalInfo
          initialData={becomeTutorDataRef.current.personal}
          onChange={handleStep1Change}
          onValidityChange={setIsCurrentStepValid}
          provinces={provinces}
          loadingProvinces={loadingProvinces}
          isReadOnly={isFlexibleReadOnly} // Đổi thành kiểm soát linh hoạt
        />
      )}

      {step === 2 && (
        <StepEducationSubjects
          initialData={becomeTutorDataRef.current.educationSubjects}
          onChange={handleStep2Change}
          onValidityChange={setIsCurrentStepValid}
          subjectTree={subjectTree}
          loadingSubjects={loadingSubjects}
          isFlexibleReadOnly={isFlexibleReadOnly} // Truyền cả 2 loại quyền mới vào
          isCriticalReadOnly={isCriticalReadOnly}
        />
      )}

      {step === 3 && (
        <StepAreasSchedule
          initialData={becomeTutorDataRef.current.areasSchedule}
          onChange={handleStep3Change}
          onValidityChange={setIsCurrentStepValid}
          provinces={provinces}
          loadingProvinces={loadingProvinces}
          isReadOnly={isFlexibleReadOnly} // Đổi thành kiểm soát linh hoạt
        />
      )}

      {step === 4 && (
        <StepCertificatesConfirm
          initialData={becomeTutorDataRef.current.certificatesConfirm}
          onChange={handleStep4Change}
          onValidityChange={setIsCurrentStepValid}
          isReadOnly={isCriticalReadOnly}
          loading={loading}
          onSubmit={() => setIsConfirmOpen(true)}
          profileStatus={profileStatus}
        />
      )}

      {/* Navigation Buttons */}
      <div className='flex justify-between items-center gap-3 pt-3 border-t'>
        {step > 1 && (
          <Button variant='outline' onClick={handlePrevStep} className='px-5 h-10 text-xs font-semibold'>
            Quay lại
          </Button>
        )}

        <div className='flex items-center gap-2.5 ml-auto'>
          {/* Nút lưu nháp chỉ hiện ở trạng thái DRAFT hoặc REJECTED */}
          {!isFlexibleReadOnly && profileStatus !== 'APPROVED' && (
            <Button
              type='button'
              variant='secondary'
              onClick={handleSaveDraft}
              disabled={loading}
              className='px-5 h-10 text-xs font-semibold bg-muted hover:bg-muted/80'
            >
              {loading ? <IconLoader2 size={14} className='animate-spin mr-1' /> : null}
              Lưu nháp
            </Button>
          )}

          {step < 4 && (
            <Button className='gap-1 px-5 h-10 text-xs font-semibold shadow-sm'
              onClick={handleNextStep}
              disabled={!isCurrentStepValid && !isFlexibleReadOnly}>
              Tiếp theo <IconChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {profileStatus === 'APPROVED' && 'Xác nhận lưu thay đổi?'}
              {profileStatus === 'REJECTED' && 'Xác nhận nộp lại hồ sơ?'}
              {profileStatus === 'DRAFT' && 'Xác nhận gửi hồ sơ ứng tuyển?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {profileStatus === 'APPROVED' &&
                'Hệ thống sẽ tiến hành cập nhật ngay lập tức các thông tin chỉnh sửa mới của bạn vào hồ sơ công khai.'}
              {profileStatus === 'REJECTED' &&
                'Bạn đang nộp lại hồ sơ với những chỉnh sửa dựa trên phản hồi từ ban quản trị. Admin sẽ tiếp tục thẩm định lại các chứng chỉ này.'}
              {profileStatus === 'DRAFT' &&
                'Hành động này không thể hoàn tác. Sau khi gửi, bạn sẽ không thể chỉnh sửa hồ sơ cho đến khi có phản hồi duyệt từ ban quản trị.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className='bg-primary text-primary-foreground hover:bg-primary/95'>
              {profileStatus === 'APPROVED' && 'Lưu thay đổi'}
              {profileStatus === 'REJECTED' && 'Nộp lại hồ sơ'}
              {profileStatus === 'DRAFT' && 'Xác nhận gửi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

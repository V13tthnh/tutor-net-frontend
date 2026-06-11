import { matchSorter } from 'match-sorter';

// Inline type to avoid circular dependency (features → constants → features)
interface Subject {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  children?: Subject[];
}

// Cấu trúc cây: Cấp 1 (nhóm môn) → Cấp 2 (môn học) → Cấp 3+ (chuyên đề)
export const mockSubjectsFlat: Subject[] = [
  // Cấp 1: Khoa học tự nhiên
  {
    id: 1,
    parentId: null,
    name: 'Khoa học tự nhiên',
    slug: 'khoa-hoc-tu-nhien',
    description: 'Nhóm các môn học thuộc lĩnh vực khoa học tự nhiên.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-01-10T08:00:00Z'
  },
  // Cấp 2: Toán học (con của Khoa học tự nhiên)
  {
    id: 2,
    parentId: 1,
    name: 'Toán học',
    slug: 'toan-hoc',
    description: 'Toán đại cương, giải tích, đại số.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-01-15T08:00:00Z'
  },
  // Cấp 3: Đại số (con của Toán học)
  {
    id: 3,
    parentId: 2,
    name: 'Đại số',
    slug: 'dai-so',
    description: 'Đại số tuyến tính, phương trình và bất phương trình.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-02-01T08:00:00Z'
  },
  {
    id: 4,
    parentId: 2,
    name: 'Giải tích',
    slug: 'giai-tich',
    description: 'Giới hạn, đạo hàm, tích phân.',
    iconUrl: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-02-05T08:00:00Z'
  },
  {
    id: 5,
    parentId: 2,
    name: 'Hình học',
    slug: 'hinh-hoc',
    description: 'Hình học phẳng, hình học không gian.',
    iconUrl: null,
    isActive: true,
    sortOrder: 3,
    createdAt: '2023-02-10T08:00:00Z'
  },
  // Cấp 2: Vật lý (con của Khoa học tự nhiên)
  {
    id: 6,
    parentId: 1,
    name: 'Vật lý',
    slug: 'vat-ly',
    description: 'Cơ học, nhiệt học, điện từ học.',
    iconUrl: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-01-16T08:00:00Z'
  },
  {
    id: 7,
    parentId: 6,
    name: 'Cơ học',
    slug: 'co-hoc',
    description: 'Động lực học, tĩnh học, dao động sóng.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-02-15T08:00:00Z'
  },
  // Cấp 2: Hóa học
  {
    id: 8,
    parentId: 1,
    name: 'Hóa học',
    slug: 'hoa-hoc',
    description: 'Hóa hữu cơ và vô cơ.',
    iconUrl: null,
    isActive: true,
    sortOrder: 3,
    createdAt: '2023-02-10T08:00:00Z'
  },
  // Cấp 2: Sinh học
  {
    id: 9,
    parentId: 1,
    name: 'Sinh học',
    slug: 'sinh-hoc',
    description: 'Sinh học tế bào, di truyền, sinh thái.',
    iconUrl: null,
    isActive: false,
    sortOrder: 4,
    createdAt: '2023-02-20T08:00:00Z'
  },

  // Cấp 1: Khoa học xã hội
  {
    id: 10,
    parentId: null,
    name: 'Khoa học xã hội',
    slug: 'khoa-hoc-xa-hoi',
    description: 'Nhóm các môn học thuộc lĩnh vực xã hội, nhân văn.',
    iconUrl: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-01-11T08:00:00Z'
  },
  {
    id: 11,
    parentId: 10,
    name: 'Lịch sử',
    slug: 'lich-su',
    description: 'Lịch sử Việt Nam và thế giới.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-03-01T08:00:00Z'
  },
  {
    id: 12,
    parentId: 10,
    name: 'Địa lý',
    slug: 'dia-ly',
    description: 'Địa lý tự nhiên và địa lý kinh tế.',
    iconUrl: null,
    isActive: false,
    sortOrder: 2,
    createdAt: '2023-03-05T08:00:00Z'
  },

  // Cấp 1: Ngoại ngữ
  {
    id: 13,
    parentId: null,
    name: 'Ngoại ngữ',
    slug: 'ngoai-ngu',
    description: 'Các môn học ngoại ngữ.',
    iconUrl: null,
    isActive: true,
    sortOrder: 3,
    createdAt: '2023-01-12T08:00:00Z'
  },
  {
    id: 14,
    parentId: 13,
    name: 'Tiếng Anh',
    slug: 'tieng-anh',
    description: 'Tiếng Anh tổng quát và học thuật.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-03-10T08:00:00Z'
  },
  {
    id: 15,
    parentId: 14,
    name: 'IELTS',
    slug: 'ielts',
    description: 'Luyện thi chứng chỉ IELTS quốc tế.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-03-15T08:00:00Z'
  },
  {
    id: 16,
    parentId: 14,
    name: 'TOEIC',
    slug: 'toeic',
    description: 'Luyện thi chứng chỉ TOEIC.',
    iconUrl: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-03-20T08:00:00Z'
  },
  {
    id: 17,
    parentId: 13,
    name: 'Tiếng Nhật',
    slug: 'tieng-nhat',
    description: 'Tiếng Nhật từ cơ bản đến nâng cao.',
    iconUrl: null,
    isActive: true,
    sortOrder: 2,
    createdAt: '2023-04-01T08:00:00Z'
  },

  // Cấp 1: Công nghệ thông tin
  {
    id: 18,
    parentId: null,
    name: 'Công nghệ thông tin',
    slug: 'cong-nghe-thong-tin',
    description: 'Lập trình, thuật toán và khoa học máy tính.',
    iconUrl: null,
    isActive: true,
    sortOrder: 4,
    createdAt: '2023-01-13T08:00:00Z'
  },
  {
    id: 19,
    parentId: 18,
    name: 'Lập trình',
    slug: 'lap-trinh',
    description: 'Các ngôn ngữ và kỹ thuật lập trình.',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-04-10T08:00:00Z'
  },
  {
    id: 20,
    parentId: 19,
    name: 'Lập trình Web',
    slug: 'lap-trinh-web',
    description: 'HTML, CSS, JavaScript, React, Next.js...',
    iconUrl: null,
    isActive: true,
    sortOrder: 1,
    createdAt: '2023-04-15T08:00:00Z'
  }
];

// Chuyển flat list thành cây
function buildTree(flat: Subject[], parentId: number | null = null): Subject[] {
  return flat
    .filter((s) => s.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ ...s, children: buildTree(flat, s.id) }));
}

export const mockSubjectTree = buildTree(mockSubjectsFlat);

// Lấy tất cả flat subjects (tương thích ngược)
export const mockSubjects = mockSubjectsFlat;

export async function getMockSubjectTree(search?: string): Promise<{
  success: boolean;
  subjects: Subject[];
}> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (search && search.trim()) {
    const filtered = matchSorter(mockSubjectsFlat, search, {
      keys: ['name', 'slug', 'description']
    });
    return { success: true, subjects: buildTree(filtered) };
  }

  return { success: true, subjects: buildTree(mockSubjectsFlat) };
}

export async function getMockSubjects(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  sort?: string
) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filtered = [...mockSubjectsFlat];

  if (search) {
    filtered = matchSorter(filtered, search, {
      keys: ['name', 'slug', 'description']
    });
  }

  if (status) {
    const isActive = status.toLowerCase() === 'active';
    filtered = filtered.filter((s) => s.isActive === isActive);
  }

  if (sort) {
    try {
      const parsedSort = JSON.parse(sort);
      if (Array.isArray(parsedSort) && parsedSort.length > 0) {
        const { id, desc } = parsedSort[0];
        filtered.sort((a, b) => {
          const aValue = a[id as keyof typeof a] ?? '';
          const bValue = b[id as keyof typeof b] ?? '';
          if (aValue < bValue) return desc ? 1 : -1;
          if (aValue > bValue) return desc ? -1 : 1;
          return 0;
        });
      }
    } catch (e) {
      console.error('Failed to parse sort parameter:', e);
    }
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Sample data for testing and development.',
    total_subjects: total,
    offset,
    limit,
    subjects: paginated
  };
}

export async function getMockSubjectStats() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const total = mockSubjectsFlat.length;
  const active = mockSubjectsFlat.filter((s) => s.isActive).length;
  const inactive = total - active;

  return {
    success: true,
    totalSubjects: total,
    activeSubjects: active,
    inactiveSubjects: inactive
  };
}

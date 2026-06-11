////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker/locale/vi';
import { matchSorter } from 'match-sorter';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const SUBJECTS = [
  'Toán',
  'Vật Lý',
  'Hóa Học',
  'Sinh Học',
  'Ngữ Văn',
  'Tiếng Anh',
  'Lịch Sử',
  'Địa Lý',
  'Tin Học',
  'GDCD'
];

export const LEVELS = [
  'Tiểu học',
  'THCS',
  'THPT',
  'Đại học',
  'Luyện thi đại học',
  'Người đi làm'
];

export const PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái'
];

export const TEACHING_METHODS = ['Online (Trực tuyến)', 'Offline (Tại nhà)', 'Onlive + Offline'];

export const GENDERS = ['Nam', 'Nữ'];

export type Tutor = {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url: string;
  gender: string;
  age: number;
  province: string;
  subjects: string[];
  levels: string[];
  teaching_method: string;
  price_per_session: number;
  experience_years: number;
  rating: number;
  total_reviews: number;
  university: string;
  bio: string;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

const UNIVERSITIES = [
  'Đại học Quốc gia Hà Nội',
  'Đại học Bách khoa Hà Nội',
  'Đại học Quốc gia TP.HCM',
  'Đại học Sư phạm Hà Nội',
  'Đại học Kinh tế Quốc dân',
  'Đại học Ngoại thương',
  'Đại học Y Hà Nội',
  'Học viện Công nghệ Bưu chính Viễn thông',
  'Đại học Sư phạm TP.HCM',
  'Đại học Đà Nẵng',
  'Đại học Huế',
  'Đại học Cần Thơ',
  'Đại học FPT',
  'Đại học RMIT Việt Nam'
];

const AVATAR_STYLES = ['adventurer', 'avataaars', 'big-ears', 'croodles', 'miniavs'];

// Generate deterministic avatar from seed
function getAvatarUrl(id: number, gender: string): string {
  const style = AVATAR_STYLES[id % AVATAR_STYLES.length];
  const seed = `tutor-${id}-${gender}`;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

export const fakeTutors = {
  records: [] as Tutor[],

  initialize() {
    const sampleTutors: Tutor[] = [];

    const vietnameseMaleNames = [
      'Nguyễn Văn An', 'Trần Minh Hùng', 'Lê Đức Thắng', 'Phạm Quang Vinh',
      'Hoàng Anh Tuấn', 'Vũ Đình Nam', 'Đặng Văn Khoa', 'Bùi Tiến Dũng',
      'Đỗ Mạnh Cường', 'Ngô Văn Hải', 'Phan Thanh Bình', 'Lưu Văn Long',
      'Trịnh Minh Đức', 'Đinh Quốc Hưng', 'Mai Văn Tùng', 'Cao Đình Phúc',
      'Vương Thành Tài', 'Chu Minh Kiên', 'Tạ Quang Thiện', 'Hồ Văn Quyền'
    ];

    const vietnameseFemaleNames = [
      'Nguyễn Thị Lan', 'Trần Thị Mai', 'Lê Thị Hương', 'Phạm Thị Hoa',
      'Hoàng Thị Ngọc', 'Vũ Thị Linh', 'Đặng Thị Thu', 'Bùi Thị Phương',
      'Đỗ Thị Hằng', 'Ngô Thị Yến', 'Phan Thị Thủy', 'Lưu Thị Diệu',
      'Trịnh Thị Trang', 'Đinh Thị Nhung', 'Mai Thị Ánh', 'Cao Thị Bích',
      'Vương Thị Khánh', 'Chu Thị Nhã', 'Tạ Thị Quỳnh', 'Hồ Thị Giang'
    ];

    const bios = [
      'Gia sư có kinh nghiệm nhiều năm, phương pháp dạy dễ hiểu, tận tình với học sinh.',
      'Tốt nghiệp loại giỏi, có phương pháp giảng dạy hiệu quả, giúp học sinh nắm vững kiến thức.',
      'Chuyên luyện thi đại học, đã giúp nhiều học sinh đạt điểm cao trong các kỳ thi.',
      'Gia sư nhiều năm kinh nghiệm, kiên nhẫn, tỉ mỉ, theo sát từng học sinh.',
      'Giảng viên đại học kiêm gia sư, có kiến thức chuyên sâu và phương pháp sư phạm tốt.',
      'Học sinh giỏi quốc gia, am hiểu tâm lý học sinh, dạy theo phong cách thân thiện.',
      'Từng làm giáo viên tại trường THPT, nay chuyên gia sư tại nhà và online.',
      'Chuyên gia dạy kèm, cam kết kết quả sau 3 tháng học, hoàn tiền nếu không tiến bộ.'
    ];

    for (let i = 1; i <= 60; i++) {
      const gender = i % 2 === 0 ? 'Nam' : 'Nữ';
      const nameList = gender === 'Nam' ? vietnameseMaleNames : vietnameseFemaleNames;
      const fullName = nameList[(i - 1) % nameList.length];
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const numSubjects = Math.floor(Math.random() * 3) + 1;
      const subjectIndices = new Set<number>();
      while (subjectIndices.size < numSubjects) {
        subjectIndices.add(Math.floor(Math.random() * SUBJECTS.length));
      }
      const subjects = Array.from(subjectIndices).map((idx) => SUBJECTS[idx]);

      const numLevels = Math.floor(Math.random() * 3) + 1;
      const levelIndices = new Set<number>();
      while (levelIndices.size < numLevels) {
        levelIndices.add(Math.floor(Math.random() * LEVELS.length));
      }
      const levels = Array.from(levelIndices).map((idx) => LEVELS[idx]);

      const price = [100000, 150000, 200000, 250000, 300000, 350000, 400000, 500000][
        Math.floor(Math.random() * 8)
      ];
      const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
      const experienceYears = Math.floor(Math.random() * 8) + 1;

      sampleTutors.push({
        id: i,
        first_name: firstName,
        last_name: lastName,
        avatar_url: getAvatarUrl(i, gender),
        gender,
        age: 20 + Math.floor(Math.random() * 15),
        province: PROVINCES[Math.floor(Math.random() * 10)], // Top 10 provinces
        subjects,
        levels,
        teaching_method: TEACHING_METHODS[Math.floor(Math.random() * 3)],
        price_per_session: price,
        experience_years: experienceYears,
        rating,
        total_reviews: Math.floor(Math.random() * 120) + 5,
        university: UNIVERSITIES[Math.floor(Math.random() * UNIVERSITIES.length)],
        bio: bios[Math.floor(Math.random() * bios.length)],
        is_verified: Math.random() > 0.3,
        is_featured: i <= 6,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.records = sampleTutors;
  },

  async getAll({
    subjects = [],
    levels = [],
    provinces = [],
    genders = [],
    teaching_methods = [],
    search
  }: {
    subjects?: string[];
    levels?: string[];
    provinces?: string[];
    genders?: string[];
    teaching_methods?: string[];
    search?: string;
  }) {
    let tutors = [...this.records];

    if (subjects.length > 0) {
      tutors = tutors.filter((t) => t.subjects.some((s) => subjects.includes(s)));
    }
    if (levels.length > 0) {
      tutors = tutors.filter((t) => t.levels.some((l) => levels.includes(l)));
    }
    if (provinces.length > 0) {
      tutors = tutors.filter((t) => provinces.includes(t.province));
    }
    if (genders.length > 0) {
      tutors = tutors.filter((t) => genders.includes(t.gender));
    }
    if (teaching_methods.length > 0) {
      tutors = tutors.filter((t) => teaching_methods.includes(t.teaching_method));
    }
    if (search) {
      tutors = matchSorter(tutors, search, {
        keys: ['first_name', 'last_name', 'bio', 'university']
      });
    }

    return tutors;
  },

  async getTutors({
    page = 1,
    limit = 12,
    subjects,
    levels,
    province,
    gender,
    teaching_method,
    search,
    sort
  }: {
    page?: number;
    limit?: number;
    subjects?: string;
    levels?: string;
    province?: string;
    gender?: string;
    teaching_method?: string;
    search?: string;
    sort?: string;
  }) {
    await delay(500);

    const subjectsArray = subjects ? String(subjects).split(',').filter(Boolean) : [];
    const levelsArray = levels ? String(levels).split(',').filter(Boolean) : [];
    const provincesArray = province ? String(province).split(',').filter(Boolean) : [];
    const gendersArray = gender ? String(gender).split(',').filter(Boolean) : [];
    const methodsArray = teaching_method
      ? String(teaching_method).split(',').filter(Boolean)
      : [];

    const allTutors = await this.getAll({
      subjects: subjectsArray,
      levels: levelsArray,
      provinces: provincesArray,
      genders: gendersArray,
      teaching_methods: methodsArray,
      search
    });

    // Sorting
    if (sort) {
      try {
        const [field, dir] = sort.split(':');
        const desc = dir === 'desc';
        allTutors.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[field!];
          const bVal = (b as Record<string, unknown>)[field!];
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return desc ? bVal - aVal : aVal - bVal;
          }
          const aStr = String(aVal ?? '').toLowerCase();
          const bStr = String(bVal ?? '').toLowerCase();
          return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
        });
      } catch {
        // ignore invalid sort
      }
    }

    const totalTutors = allTutors.length;
    const offset = (page - 1) * limit;
    const paginatedTutors = allTutors.slice(offset, offset + limit);

    return {
      success: true,
      time: new Date().toISOString(),
      total_tutors: totalTutors,
      offset,
      limit,
      tutors: paginatedTutors
    };
  },

  async getFeatured(count = 6): Promise<Tutor[]> {
    await delay(200);
    return this.records.filter((t) => t.is_featured).slice(0, count);
  },

  async getTutorById(id: number) {
    await delay(500);
    const tutor = this.records.find((t) => t.id === id);

    if (!tutor) {
      return {
        success: false,
        message: `Tutor with ID ${id} not found`
      };
    }

    return {
      success: true,
      time: new Date().toISOString(),
      tutor
    };
  }
};

fakeTutors.initialize();

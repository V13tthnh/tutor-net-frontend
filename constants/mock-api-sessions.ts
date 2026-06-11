// //////////////////////////////////////////////////////////////////////////////
// Mock API Sessions Database
// //////////////////////////////////////////////////////////////////////////////

export interface Session {
  id: number;
  tutor_id: number;
  tutor_name: string;
  student_id: number;
  student_name: string;
  booked_by: number; // Parent/User ID
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  price: number;
  subject: string;
  has_review: boolean;
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: 1,
    tutor_id: 1,
    tutor_name: 'Nguyễn Văn An',
    student_id: 101,
    student_name: 'Nguyễn Minh Quân',
    booked_by: 1001, // Parent
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    duration_minutes: 90,
    status: 'completed',
    price: 300000,
    subject: 'Toán',
    has_review: false
  },
  {
    id: 2,
    tutor_id: 2,
    tutor_name: 'Lê Thị Bình',
    student_id: 101,
    student_name: 'Nguyễn Minh Quân',
    booked_by: 1001,
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    duration_minutes: 90,
    status: 'completed',
    price: 250000,
    subject: 'Vật Lý',
    has_review: true
  },
  {
    id: 3,
    tutor_id: 3,
    tutor_name: 'Phạm Văn Cường',
    student_id: 101,
    student_name: 'Nguyễn Minh Quân',
    booked_by: 1001,
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    duration_minutes: 120,
    status: 'ongoing',
    price: 350000,
    subject: 'Hóa Học',
    has_review: false
  },
  {
    id: 4,
    tutor_id: 4,
    tutor_name: 'Hoàng Thị Dung',
    student_id: 101,
    student_name: 'Nguyễn Minh Quân',
    booked_by: 1001,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
    duration_minutes: 90,
    status: 'pending',
    price: 280000,
    subject: 'Tiếng Anh',
    has_review: false
  },
  {
    id: 5,
    tutor_id: 1,
    tutor_name: 'Nguyễn Văn An',
    student_id: 102,
    student_name: 'Trần Thảo Vy',
    booked_by: 1002, // Other Parent
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    duration_minutes: 90,
    status: 'completed',
    price: 300000,
    subject: 'Toán',
    has_review: true
  }
];

class FakeSessionsDb {
  private records: Session[] = [];

  constructor() {
    this.records = [...INITIAL_SESSIONS];
  }

  async getSessions(filters: { role?: string; userId?: number }) {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const { role, userId } = filters;
    if (!role || !userId) {
      return this.records;
    }

    if (role === 'admin') {
      return this.records;
    }

    if (role === 'tutor') {
      // Find sessions where tutor_id matches user's tutor representation.
      // For simplicity, let's assume tutor's tutor_id is equal to the simulated userId.
      return this.records.filter((s) => s.tutor_id === userId);
    }

    // Default to parent
    return this.records.filter((s) => s.booked_by === userId);
  }

  async getSessionById(id: number): Promise<Session | undefined> {
    return this.records.find((s) => s.id === id);
  }

  async completeSession(id: number): Promise<boolean> {
    const session = this.records.find((s) => s.id === id);
    if (session && session.status !== 'completed') {
      session.status = 'completed';
      return true;
    }
    return false;
  }

  async updateSessionReviewStatus(id: number, hasReview: boolean): Promise<boolean> {
    const session = this.records.find((s) => s.id === id);
    if (session) {
      session.has_review = hasReview;
      return true;
    }
    return false;
  }
}

export const fakeSessions = new FakeSessionsDb();

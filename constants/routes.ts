// constants/routes.ts

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  ADMIN: {
    LOGIN: "/admin/login",
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    TUTORS: "/admin/tutors",
    CONTRACTS: "/admin/contracts",
    REVIEW: "/admin/review",
    MANAGE_CLASS: "/admin/manage-class",
  },

  PROFILE: (id: string) => `/profile/${id}`,

  CLASS_DETAIL: (id: string) => `/classes/${id}`,
};
import type { User } from "../backend.d";

const USER_KEY = "dcc_user";

export type StoredUser = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "user";
};

export function isLoggedIn(): boolean {
  return localStorage.getItem(USER_KEY) !== null;
}

export function getLoggedInUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function loginWithUser(user: User): void {
  const stored: StoredUser = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role === "admin" ? "admin" : "user",
  };
  localStorage.setItem(USER_KEY, JSON.stringify(stored));
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}

export function isAdmin(): boolean {
  const user = getLoggedInUser();
  return user?.role === "admin";
}

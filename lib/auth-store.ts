// lib/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: number;
  email: string;
  createdAt?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'clueso-clone-auth',
    }
  )
);

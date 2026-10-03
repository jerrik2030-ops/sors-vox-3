import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  country: string;
  bio: string;
  interests: string[];
  avatarColor?: string;
  preferredTopic?: string;
}

export interface Match {
  id: string;
  user: User;
  sharedInterests: string[];
  matchScore?: number;
  icebreaker?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isMatching: boolean;
  currentMatch: Match | null;
  selectedIcebreaker: string | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  startMatching: () => void;
  stopMatching: () => void;
  setMatch: (match: Match) => void;
  endMatch: () => void;
  setSelectedIcebreaker: (icebreaker: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isMatching: false,
      currentMatch: null,
      selectedIcebreaker: null,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, currentMatch: null, isMatching: false, selectedIcebreaker: null }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      startMatching: () => set({ isMatching: true }),
      stopMatching: () => set({ isMatching: false }),
      setMatch: (match) => set({ currentMatch: match, isMatching: false }),
      endMatch: () => set({ currentMatch: null, selectedIcebreaker: null }),
      setSelectedIcebreaker: (icebreaker) => set({ selectedIcebreaker: icebreaker }),
    }),
    {
      name: 'sors-vox-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

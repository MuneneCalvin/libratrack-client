import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  darkMode: boolean;
  sidebarOpen: boolean;
  notificationCount: number;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationCount: (count: number) => void;
  incrementNotificationCount: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      notificationCount: 0,
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setNotificationCount: (notificationCount) => set({ notificationCount }),
      incrementNotificationCount: () =>
        set((state) => ({ notificationCount: state.notificationCount + 1 })),
    }),
    {
      name: 'libratrack-ui',
      partialize: (state) => ({ darkMode: state.darkMode }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add('dark');
      },
    },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StyleType } from '@ai-clipart/shared';
import { STYLE_TYPES } from '@ai-clipart/shared';

type SelectedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
};

type AppState = {
  deviceId: string | null;
  selectedImage: SelectedImage | null;
  selectedStyles: StyleType[];
  setDeviceId: (deviceId: string) => void;
  setSelectedImage: (image: SelectedImage | null) => void;
  toggleStyle: (style: StyleType) => void;
  resetDraft: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      deviceId: null,
      selectedImage: null,
      selectedStyles: [...STYLE_TYPES],
      setDeviceId: (deviceId) => set({ deviceId }),
      setSelectedImage: (selectedImage) => set({ selectedImage }),
      toggleStyle: (style) =>
        set((state) => {
          const exists = state.selectedStyles.includes(style);
          const selectedStyles =
            exists && state.selectedStyles.length > 1
              ? state.selectedStyles.filter((item) => item !== style)
              : exists
                ? state.selectedStyles
                : [...state.selectedStyles, style];

          return { selectedStyles };
        }),
      resetDraft: () =>
        set({
          selectedImage: null,
          selectedStyles: [...STYLE_TYPES],
        }),
    }),
    {
      name: 'ai-clipart-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        deviceId: state.deviceId,
        selectedStyles: state.selectedStyles,
      }),
    },
  ),
);

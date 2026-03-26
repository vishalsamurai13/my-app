import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STYLE_TYPES, type ShapeType, type StyleType } from '@ai-clipart/shared';

export type SelectedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
};

type AppState = {
  selectedImage: SelectedImage | null;
  prompt: string;
  selectedStyles: StyleType[];
  selectedShape: ShapeType;
  activeResultStyle: StyleType | null;
  setSelectedImage: (image: SelectedImage | null) => void;
  setPrompt: (prompt: string) => void;
  toggleStyle: (style: StyleType) => { ok: boolean; reason?: string };
  setSelectedShape: (shape: ShapeType) => void;
  setActiveResultStyle: (style: StyleType | null) => void;
  resetDraft: () => void;
};

const DEFAULT_STYLES: StyleType[] = ['cartoon'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedImage: null,
      prompt: '',
      selectedStyles: DEFAULT_STYLES,
      selectedShape: 'square',
      activeResultStyle: null,
      setSelectedImage: (selectedImage) => set({ selectedImage }),
      setPrompt: (prompt) => set({ prompt }),
      toggleStyle: (style) => {
        const { selectedStyles } = get();
        const exists = selectedStyles.includes(style);

        if (exists) {
          const next = selectedStyles.filter((item) => item !== style);
          if (next.length === 0) {
            return { ok: false, reason: 'Select at least one style.' };
          }
          set({ selectedStyles: next });
          return { ok: true };
        }

        if (selectedStyles.length >= 4) {
          return { ok: false, reason: 'You can select a maximum of 4 styles.' };
        }

        set({ selectedStyles: [...selectedStyles, style] });
        return { ok: true };
      },
      setSelectedShape: (selectedShape) => set({ selectedShape }),
      setActiveResultStyle: (activeResultStyle) => set({ activeResultStyle }),
      resetDraft: () =>
        set({
          selectedImage: null,
          prompt: '',
          selectedStyles: DEFAULT_STYLES,
          selectedShape: 'square',
          activeResultStyle: null,
        }),
    }),
    {
      name: 'ai-clipart-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        prompt: state.prompt,
        selectedStyles: state.selectedStyles.filter((style) => STYLE_TYPES.includes(style)),
        selectedShape: state.selectedShape,
      }),
    },
  ),
);

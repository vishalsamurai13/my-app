import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

type ToastVariant = 'success' | 'error' | 'info';

type ToastPayload = {
  title: string;
  message?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-[#3c7f63] bg-[#13281d]',
  error: 'border-[#7f3c55] bg-[#2a1520]',
  info: 'border-border-card bg-card',
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!toast) return undefined;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 180,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setToast(null);
        }
      });
    }, 2600);

    return () => clearTimeout(timer);
  }, [opacity, toast, translateY]);

  const value = useMemo(
    () => ({
      showToast(nextToast: ToastPayload) {
        opacity.setValue(0);
        translateY.setValue(-16);
        setToast(nextToast);
      },
    }),
    [opacity, translateY],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{
            opacity,
            transform: [{ translateY }],
            position: 'absolute',
            top: 56,
            left: 16,
            right: 16,
            zIndex: 999,
          }}>
          <View className={`rounded-[20px] border px-4 py-3 shadow-2xl ${variantClasses[toast.variant ?? 'info']}`}>
            <Text className="text-base font-extrabold text-primary">{toast.title}</Text>
            {toast.message ? <Text className="mt-1 text-sm leading-5 text-secondary">{toast.message}</Text> : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { SectionCard } from "@/components/ui/section-card";
import { STYLE_LABELS, STYLE_TYPES } from "@ai-clipart/shared";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const previewArt = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80",
];

function HeroBgIcon() {
  return (
    <Svg
      width={160}
      height={160}
      viewBox="0 0 64 64"
      pointerEvents="none"
      style={{
        position: "absolute",
        right: -8,
        top: 8,
        opacity: 0.26,
        transform: [{ rotate: "16deg" }],
      }}
    >
      <Rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="10"
        stroke="#d8b4fe"
        strokeWidth="3"
        fill="none"
      />
      <Path
        d="M16 48 L28 30 L36 40 L44 28 L52 48Z"
        stroke="#d8b4fe"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      <Circle
        cx="20"
        cy="22"
        r="5"
        stroke="#d8b4fe"
        strokeWidth="2.5"
        fill="none"
      />
    </Svg>
  );
}

export default function HomeTab() {
  const router = useRouter();

  return (
    <Screen
      backgroundColor="#121212"
      contentClassName="gap-[18px] pt-7 pb-[130px]"
    >
      <SectionCard className="relative flex flex-col overflow-hidden min-h-[200px]">
        <HeroBgIcon />

        <Text className="mb-1.5 text-[28px] font-semibold tracking-wide text-[#a78bfa]">
          Image Generator
        </Text>

        <Text className="mt-[52px] mb-5 text-[22px] font-extrabold leading-[1.3] text-[#f1eeff]">
          Turn your ideas into polished AI portraits and stylized visuals.
        </Text>

        <View className="items-start">
          <Button
            fullWidth={false}
            onPress={() => router.push("/create" as never)}
          >
            Generate Now
          </Button>
        </View>
      </SectionCard>

      <Text className="mt-2 text-[22px] font-extrabold text-[#f1eeff]">
        Try Trending Styles
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {STYLE_TYPES.slice(0, 6).map((style, index) => (
          <Pressable
            key={style}
            className="w-[30.5%] items-center rounded-2xl border border-[#2b2340] bg-[#1a1423] p-2"
            onPress={() => router.push("/create" as never)}
          >
            <Image
              source={{ uri: previewArt[index % previewArt.length] }}
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 10,
                marginBottom: 8,
              }}
            />
            <Text className="pb-0.5 text-[13px] font-medium text-[#beb7cb]">
              {STYLE_LABELS[style]}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

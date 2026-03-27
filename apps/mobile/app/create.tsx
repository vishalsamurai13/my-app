import { useAuth } from "@clerk/clerk-expo";
import {
  SHAPE_TYPES,
  STYLE_LABELS,
  STYLE_TYPES,
  type ShapeType,
} from "@ai-clipart/shared";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { ChevronLeft, ImagePlus, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { useCreateJob } from "@/features/generation/use-create-job";
import { useImageSelection } from "@/features/image-upload/use-image-selection";
import { useAppStore } from "@/lib/store/app-store";

const shapeStyles = {
  square: { width: 34, height: 34 },
  landscape: { width: 42, height: 24 },
  portrait: { width: 24, height: 42 },
  custom: { width: 28, height: 28 },
} as const;

const stylePreviewArt: Record<(typeof STYLE_TYPES)[number], string> = {
  cartoon:
    "https://cdn.dribbble.com/userupload/17934448/file/original-8646cf8a6ed46219976a2163e8ab7dea.jpg?resize=1600x1200&vertical=center",
  anime:
    "https://cdn.dribbble.com/userupload/46688981/file/9626db674498c07511bd900bfa98a7ac.png?resize=1600x2400&vertical=center",
  illustration:
    "https://cdn.dribbble.com/userupload/46545838/file/198b71f7433506ecde6ddf0f910c5c70.jpg?resize=2000x2000&vertical=center",
  pixel:
    "https://cdn.dribbble.com/userupload/3779062/file/original-e23c8a51ca81f8d141deca53f452b141.jpg?resize=2340x1560&vertical=center",
  sketch:
    "https://cdn11.bigcommerce.com/s-x49po/images/stencil/1500x1500/products/135594/302588/handmade%2Fdownscaled%2Fh_t8nuwid3sps_2000x2000__58023.1748348500.jpg?c=2",
  fantasy:
    "https://thumbs.dreamstime.com/b/warrior-man-wanderer-pass-magical-land-sword-faithful-bird-fantasy-illustration-digital-art-50015815.jpg",
  comic:
    "https://i.pinimg.com/736x/db/f8/e2/dbf8e26c21fda42f4959ae658fb4f789.jpg",
  watercolor:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx1W8V9eu3yCcX8GE2Mlgv6Aa0hh4XvL5svg&s",
};

export default function CreateScreen() {
  const { isSignedIn } = useAuth();
  const image = useAppStore((state) => state.selectedImage);
  const prompt = useAppStore((state) => state.prompt);
  const selectedStyles = useAppStore((state) => state.selectedStyles);
  const selectedShape = useAppStore((state) => state.selectedShape);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const toggleStyle = useAppStore((state) => state.toggleStyle);
  const setSelectedShape = useAppStore((state) => state.setSelectedShape);
  const createJobMutation = useCreateJob();
  const imageSelection = useImageSelection();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isGenerateDisabled =
    !image || createJobMutation.isPending || imageSelection.isPicking;

  useEffect(() => {
    if (imageSelection.error) {
      setFeedbackMessage(imageSelection.error);
    }
  }, [imageSelection.error]);

  useEffect(() => {
    if (createJobMutation.error instanceof Error) {
      setFeedbackMessage(createJobMutation.error.message);
    }
  }, [createJobMutation.error]);

  function openPicker() {
    setIsPickerVisible(true);
  }

  async function handlePick(source: "camera" | "gallery") {
    await imageSelection.handlePick(source);
    setIsPickerVisible(false);
  }

  function handleToggleStyle(style: (typeof STYLE_TYPES)[number]) {
    const result = toggleStyle(style);
    if (!result.ok && result.reason) {
      setFeedbackMessage(result.reason);
      return;
    }
    setFeedbackMessage(null);
  }

  function handleGenerate() {
    if (!isSignedIn) {
      router.push("/sign-in?redirectTo=/create" as never);
      return;
    }

    createJobMutation.mutate();
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)" as never);
  }

  return (
    <Screen backgroundColor="#121212" contentClassName="gap-[18px] pt-6 pb-12">
      <View className="relative flex-row items-center justify-center">
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          className="absolute left-0 h-11 w-11 items-center justify-center rounded-full bg-border-card"
        >
          <ChevronLeft color="#ffffff" size={22} />
        </Pressable>
        <Text className="text-center text-[30px] font-black text-primary">
          Generate an Image
        </Text>
      </View>

      <Text className="text-2xl font-bold mt-[20px] text-primary">
        Describe what you’d like to create
      </Text>

      <View className="gap-4 rounded-xl3 border border-[#302646] bg-card p-4">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe the final look, lighting, mood, or composition."
          placeholderTextColor="#7b7589"
          multiline
          className="min-h-[120px] text-[17px] leading-6 text-primary"
          style={{ textAlignVertical: "top" }}
        />

        {image ? (
          <View className="gap-2.5">
            <View className="h-[220px] items-center justify-center overflow-hidden rounded-[18px] bg-card-muted">
              <Image
                source={{ uri: image.uri }}
                contentFit="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
            <View className="flex-row justify-between gap-3">
              <Text numberOfLines={1} className="flex-1 text-[13px] text-muted">
                {image.fileName}
              </Text>
              <Text className="flex-1 text-[13px] text-muted">
                {image.fileSize
                  ? `${Math.max(1, Math.round(image.fileSize / 1024 / 1024))} MB`
                  : image.mimeType}
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable
          className="self-start rounded-full border border-border-muted px-3.5 py-2.5"
          onPress={openPicker}
        >
          <View className="flex-row items-center gap-2">
            <ImagePlus color="#c3b6dc" size={18} />
            <Text className="font-bold text-[#c3b6dc]">
              {image ? "Replace Image" : "Upload Image"}
            </Text>
          </View>
        </Pressable>
      </View>

      {feedbackMessage ? (
        <View className="rounded-2xl border border-[#52315d] bg-[#2a1a30] px-4 py-3">
          <Text className="mb-1 text-xs font-bold uppercase tracking-[1px] text-[#f0b8ff]">
            Attention
          </Text>
          <Text className="leading-5 text-[#f5d5ff]">{feedbackMessage}</Text>
        </View>
      ) : null}

      <Text className="text-2xl font-bold mt-[20px] text-primary">
        Choose a style
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {STYLE_TYPES.map((style) => {
          const active = selectedStyles.includes(style);

          return (
            <Pressable
              key={style}
              className={`w-[22%] min-w-[76px] items-center rounded-2xl border p-2 ${active ? "border-border-accent bg-[#241733]" : "border-border-card bg-card"}`}
              onPress={() => handleToggleStyle(style)}
            >
              <Image
                source={{ uri: stylePreviewArt[style] }}
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: 10,
                  marginBottom: 8,
                  opacity: active ? 1 : 0.9,
                }}
              />
              <Text
                className={`pb-0.5 text-center text-[12px] font-medium ${active ? "text-primary" : "text-[#beb7cb]"}`}
              >
                {STYLE_LABELS[style]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-2xl mt-[20px] font-bold text-primary">
        Choose Shape
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {SHAPE_TYPES.map((shape) => (
          <View key={shape} className="min-w-[74px] w-[22%] items-center gap-2">
            <Pressable
              className={`h-[78px] w-full items-center justify-center rounded-[18px] border bg-card ${selectedShape === shape ? "border-border-accent" : "border-border-card"}`}
              onPress={() => setSelectedShape(shape as ShapeType)}
            >
              {shape === "custom" ? (
                <Plus color="#ffffff" size={22} />
              ) : (
                <View
                  className="rounded-lg border-2 border-primary"
                  style={shapeStyles[shape]}
                />
              )}
            </Pressable>
            <Text className="text-center text-[13px] font-semibold text-primary">
              {shape[0].toUpperCase() + shape.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4 gap-3">
        <Button
          disabled={isGenerateDisabled}
          loading={createJobMutation.isPending || imageSelection.isPicking}
          onPress={handleGenerate}
        >
          Generate Images
        </Button>
        <Text className="text-center leading-5 text-[#aaa3b9]">
          {image
            ? `${selectedStyles.length}/4 styles selected. ${isSignedIn ? "Ready to generate." : "Sign in is required to generate and save."}`
            : "Upload an image to enable generation. You can choose up to 4 styles per batch."}
        </Text>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isPickerVisible}
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <Pressable
            className="flex-1"
            onPress={() => setIsPickerVisible(false)}
          />
          <View className="rounded-t-[28px] bg-sheet px-5 pb-8 pt-2.5">
            <View className="mb-[18px] h-[5px] w-[52px] self-center rounded-full bg-sheet-handle" />
            <Text className="mb-[14px] text-lg font-bold text-dark">
              Select image source
            </Text>
            <View className="gap-3 pt-2">
              <Button variant="ghost" onPress={() => void handlePick("camera")}>
                Camera
              </Button>
              <Button
                variant="ghost"
                onPress={() => void handlePick("gallery")}
              >
                Gallery
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

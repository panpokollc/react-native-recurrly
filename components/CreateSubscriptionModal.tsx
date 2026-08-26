import { clsx } from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";

const FREQUENCIES = ["Monthly", "Yearly"] as const;
const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type Frequency = (typeof FREQUENCIES)[number];
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: "#f5c2c7",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#b8d8f0",
  Music: "#c9e8d2",
  Other: "#e8dfcf",
};

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] = useState<Category>("Entertainment");
  const [nameTouched, setNameTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);

  const parsedPrice = Number(price);
  const nameError = nameTouched && !name.trim() ? "Enter a subscription name." : undefined;
  const priceError =
    priceTouched && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
      ? "Enter a price greater than zero."
      : undefined;
  const canSubmit = Boolean(name.trim()) && Number.isFinite(parsedPrice) && parsedPrice > 0;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    setNameTouched(false);
    setPriceTouched(false);
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const submit = () => {
    setNameTouched(true);
    setPriceTouched(true);
    if (!canSubmit) return;

    const startDate = dayjs();
    const renewalDate = startDate.add(1, frequency === "Monthly" ? "month" : "year");

    onCreate({
      id: `subscription-${Date.now()}`,
      name: name.trim(),
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate: startDate.toISOString(),
      renewalDate: renewalDate.toISOString(),
      icon: icons.wallet,
      billing: frequency,
      color: CATEGORY_COLORS[category],
    });
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        className="modal-overlay"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="flex-1" onPress={closeModal} accessibilityLabel="Close modal" />
        <View className="modal-container" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable
              className="modal-close"
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close new subscription form"
              hitSlop={8}
            >
              <Text className="modal-close-text">×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="modal-body"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className={clsx("auth-input", nameError && "auth-input-error")}
                value={name}
                onChangeText={setName}
                onBlur={() => setNameTouched(true)}
                placeholder="e.g. Netflix"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Subscription name"
              />
              {nameError ? <Text className="auth-error">{nameError}</Text> : null}
            </View>

            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                className={clsx("auth-input", priceError && "auth-input-error")}
                value={price}
                onChangeText={setPrice}
                onBlur={() => setPriceTouched(true)}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="done"
                accessibilityLabel="Subscription price"
              />
              {priceError ? <Text className="auth-error">{priceError}</Text> : null}
            </View>

            <View className="auth-field">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {FREQUENCIES.map((option) => {
                  const active = frequency === option;
                  return (
                    <Pressable
                      key={option}
                      className={clsx("picker-option", active && "picker-option-active")}
                      onPress={() => setFrequency(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Text className={clsx("picker-option-text", active && "picker-option-text-active")}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="auth-field">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((option) => {
                  const active = category === option;
                  return (
                    <Pressable
                      key={option}
                      className={clsx("category-chip", active && "category-chip-active")}
                      onPress={() => setCategory(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Text className={clsx("category-chip-text", active && "category-chip-text-active")}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              className={clsx("auth-button", !canSubmit && "auth-button-disabled")}
              disabled={!canSubmit}
              onPress={submit}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              <Text className="auth-button-text">Add subscription</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

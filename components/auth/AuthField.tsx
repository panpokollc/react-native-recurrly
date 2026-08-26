import { Ionicons } from "@expo/vector-icons";
import { clsx } from "clsx";
import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors } from "@/constants/theme";

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string;
  isPassword?: boolean;
};

export default function AuthField({
  label,
  error,
  isPassword = false,
  className,
  ...inputProps
}: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <View className="relative">
        <TextInput
          {...inputProps}
          className={clsx(
            "auth-input",
            className,
            isPassword && "pr-13",
            error && "auth-input-error",
          )}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isPassword && !passwordVisible}
          accessibilityLabel={label}
          accessibilityHint={error}
        />
        {isPassword && (
          <Pressable
            className="absolute bottom-0 right-1 top-0 size-12 items-center justify-center"
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            hitSlop={8}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              color={colors.mutedForeground}
              size={21}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text className="auth-error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

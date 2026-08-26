import { useClerk, useUser } from "@clerk/expo";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { colors } from "@/constants/theme";

import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context"
import { styled } from "nativewind"
const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
      <View className="mt-8 rounded-3xl border border-border bg-card p-5">
        <Text className="text-lg font-sans-bold text-primary">Account</Text>
        <Text className="mt-2 font-sans-semibold text-primary">
          {user?.fullName || "Recurly member"}
        </Text>
        <Text className="mt-1 font-sans-medium text-muted-foreground">
          {user?.primaryEmailAddress?.emailAddress}
        </Text>
        <Pressable
          className="mt-6 items-center rounded-2xl border border-destructive/25 bg-destructive/5 py-4"
          disabled={isSigningOut}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {isSigningOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Text className="font-sans-bold text-destructive">Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Settings;

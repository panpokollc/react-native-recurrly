import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import SubscriptionCard from "@/lib/subscriptioncard";
import { colors } from "@/constants/theme";
import { useSubscriptions } from "@/components/SubscriptionsProvider";

const SafeAreaView = styled(RNSafeAreaView);

export default function Subscriptions() {
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSubscriptions = useMemo(() => {
    if (!normalizedQuery) return subscriptions;

    return subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.category,
        subscription.plan,
        subscription.billing,
        subscription.status,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [normalizedQuery, subscriptions]);

  const clearSearch = () => {
    setQuery("");
    setExpandedSubscriptionId(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id,
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-3xl font-sans-bold text-primary">
              Subscriptions
            </Text>
            <Text className="mt-2 font-sans-medium text-muted-foreground">
              Find and manage every recurring payment in one place.
            </Text>

            <View className="mt-6 flex-row items-center rounded-2xl border border-border bg-card px-4">
              <Ionicons name="search" color={colors.mutedForeground} size={20} />
              <TextInput
                className="min-w-0 flex-1 px-3 py-4 font-sans-medium text-primary"
                value={query}
                onChangeText={setQuery}
                placeholder="Search subscriptions"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="never"
                accessibilityLabel="Search subscriptions"
              />
              {query ? (
                <Pressable
                  className="size-10 items-center justify-center"
                  onPress={clearSearch}
                  accessibilityRole="button"
                  accessibilityLabel="Clear subscription search"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" color={colors.mutedForeground} size={20} />
                </Pressable>
              ) : null}
            </View>

            <Text className="mt-4 text-sm font-sans-semibold text-muted-foreground">
              {filteredSubscriptions.length}{" "}
              {filteredSubscriptions.length === 1 ? "subscription" : "subscriptions"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-3xl border border-border bg-card px-6 py-12">
            <View className="size-14 items-center justify-center rounded-full bg-muted">
              <Ionicons name="search" color={colors.primary} size={24} />
            </View>
            <Text className="mt-4 text-lg font-sans-bold text-primary">
              No subscriptions found
            </Text>
            <Text className="mt-2 text-center font-sans-medium text-muted-foreground">
              Try another name, category, plan, or billing period.
            </Text>
            <Pressable className="mt-5 rounded-full bg-primary px-5 py-3" onPress={clearSearch}>
              <Text className="font-sans-bold text-background">Clear search</Text>
            </Pressable>
          </View>
        }
        contentContainerClassName="grow px-5 pb-30 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

import React from "react";
import { Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";

const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();  
  return (
    <View>
      <Text>Subscription Details</Text>
      <Link href="/">Go Back</Link>
    </View>
  );
};

export default SubscriptionDetails;
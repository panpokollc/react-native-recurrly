import React from "react";
import { Text, View } from "react-native";
import { Link } from "expo-router";

const SubscriptionDetails = () => {
  return (
    <View>
      <Text>Subscription Details</Text>
      <Link href="/">Go Back</Link>
    </View>
  );
};

export default SubscriptionDetails;

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";

type SubscriptionsContextValue = {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => [
    ...HOME_SUBSCRIPTIONS,
  ]);

  const value = useMemo<SubscriptionsContextValue>(
    () => ({
      subscriptions,
      addSubscription: (subscription) => {
        setSubscriptions((currentSubscriptions) => [
          subscription,
          ...currentSubscriptions,
        ]);
      },
    }),
    [subscriptions],
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);

  if (!context) {
    throw new Error("useSubscriptions must be used inside SubscriptionsProvider.");
  }

  return context;
}

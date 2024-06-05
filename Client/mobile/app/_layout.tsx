import { Stack, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useAuth0, Auth0Provider } from "react-native-auth0";

import { RealmProvider } from "@realm/react";
import { schemas } from "../schemas";
import useMessaging from "../hooks/messaging";

const Navigator = () => {
  const { user, isLoading } = useAuth0();
  useMessaging();

  const isAuthenticated = user !== undefined && user !== null;

  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack>
      {isAuthenticated && (
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        ></Stack.Screen>
      )}
      <Stack.Screen name="login" />
    </Stack>
  );
};

export default function RootLayout() {
  const path = usePathname();
  console.log("RootLayout::path: ", path);

  return (
    <Auth0Provider
      domain="dev-vzxphouz.us.auth0.com"
      clientId="9UL0KQ340BiIAL8ZtI5VMhVQn0eQqMOS"
    >
      <RealmProvider deleteRealmIfMigrationNeeded={true} schema={schemas}>
        <Navigator />
      </RealmProvider>
    </Auth0Provider>
  );
}

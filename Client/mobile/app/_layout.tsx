import { Stack } from "expo-router";
import React from "react";
import { Auth0Provider } from "react-native-auth0";

import { RealmProvider } from "@realm/react";
import { schemas } from "../schemas";
import { MessagingProvider } from "../hooks/messaging";

export default function Root() {
  return (
    <Auth0Provider
      domain="dev-vzxphouz.us.auth0.com"
      clientId="9UL0KQ340BiIAL8ZtI5VMhVQn0eQqMOS"
    >
      <RealmProvider deleteRealmIfMigrationNeeded={true} schema={schemas}>
        <MessagingProvider>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            ></Stack.Screen>
            <Stack.Screen name="login" />
          </Stack>
        </MessagingProvider>
      </RealmProvider>
    </Auth0Provider>
  );
}

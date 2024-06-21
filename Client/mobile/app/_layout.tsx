import { Stack } from "expo-router";
import React from "react";
import { Auth0Provider } from "react-native-auth0";

import { RealmProvider } from "@realm/react";
import { schemas } from "@schemas/index";
import { AppDelegateProvider } from "@hooks/useAppDelegate";

export default function Root() {
  return (
    <Auth0Provider
      domain="dev-vzxphouz.us.auth0.com"
      clientId="9UL0KQ340BiIAL8ZtI5VMhVQn0eQqMOS"
    >
      <RealmProvider deleteRealmIfMigrationNeeded={true} schema={schemas}>
        <AppDelegateProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" />
          </Stack>
        </AppDelegateProvider>
      </RealmProvider>
    </Auth0Provider>
  );
}

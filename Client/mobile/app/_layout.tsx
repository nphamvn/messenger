import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useAuth0, Auth0Provider } from "react-native-auth0";
import LoginScreen from "./login";
import ConnectionContext from "../hooks/ConnectionContext";
import * as signalR from "@microsoft/signalr";
import { appConfig } from "../constants/appConfig";
import { RealmProvider, useQuery, useRealm } from "@realm/react";
import { schemas } from "../schemas";
import { Message } from "../schemas/Message";

const Navigator = () => {
  const { user, isLoading, getCredentials } = useAuth0();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );
  const [connected, setConnected] = useState(false);
  const notSentMessages = useQuery(Message).filtered("status = 'notSent'");

  const isAuthenticated = user !== undefined && user !== null;

  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        const { accessToken } = (await getCredentials())!;
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${appConfig.API_URL}/chat`, {
            accessTokenFactory: () => accessToken,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect()
          .build();
        connection?.start().then(() => {
          console.log("Connection started");
          setConnected(true);
        });
        connection.onclose((error) => {
          console.log("Connection closed", error);
          setConnected(false);
        });
        connection.onreconnecting(() => {
          console.log("Connection reconnecting");
          setConnected(false);
        });

        connection.onreconnected(() => {
          console.log("Connection reconnected");
          setConnected(true);
        });
        setConnection(connection);
      })();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (connected && notSentMessages.length > 0) {
      notSentMessages.forEach((message: Message) => {
        connection
          ?.invoke(
            "SendMessage",
            message.conversationId,
            message.userId ? [message.userId].join(",") : "",
            message.text,
            null
          )
          .then(() => {
            console.log("Message sent");
          })
          .catch((error) => {
            console.error("Error sending message: ", error);
          })
          .finally(() => {});
      });
    }
  }, [connected, notSentMessages]);
  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ConnectionContext.Provider value={connection}>
      {isAuthenticated ? (
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          ></Stack.Screen>
        </Stack>
      ) : (
        <LoginScreen />
      )}
    </ConnectionContext.Provider>
  );
};

export default function RootLayout() {
  useEffect(() => {
    console.log("RootLayout");
  }, []);
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

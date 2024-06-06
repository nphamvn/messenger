import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Link, Stack, router, usePathname } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { appConfig } from "../../../constants/appConfig";
import { Conversation } from "../../../schemas/Conversation";
import { useQuery } from "@realm/react";
import React from "react";

export default function ConversationsScreen() {
  const path = usePathname();
  const { getCredentials } = useAuth0();
  const [, setConversations] = useState<Conversation[]>([]);
  const localConversations = useQuery(Conversation);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    (async () => {
      await fetchConversations();
      setRefreshing(false);
    })();
  }, []);

  const fetchConversations = async () => {
    const credentials = await getCredentials();
    const response = await fetch(`${appConfig.API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${credentials?.accessToken}`,
      },
    });
    const data = await response.json();
    setConversations(data);
  };

  useEffect(() => {
    (async () => {
      await fetchConversations();
    })();
  }, []);

  console.log("path: ", path);
  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link
              href="new"
              style={{
                color: "#007AFF",
              }}
            >
              New
            </Link>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
          <FlatList
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            data={localConversations}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/conversation",
                    params: {
                      cId: item.cId.toString(),
                    },
                  })
                }
              >
                <View
                  style={{
                    flexDirection: "row",
                    marginBottom: 10,
                    alignItems: "center",
                    borderBottomColor: "#ddd",
                    borderBottomWidth: 0.5,
                    paddingBottom: 10,
                  }}
                >
                  <Image
                    source={{ uri: item.users[0]?.picture }}
                    style={{ height: 40, width: 40, borderRadius: 20 }}
                  />
                  <View style={{ marginLeft: 4 }}>
                    <Text>{item.users[0]?.fullName}</Text>
                    <Text style={{ marginTop: 2 }}>
                      {item.messages[item.messages.length - 1]?.text}
                    </Text>
                  </View>
                  <Text style={{ marginStart: "auto" }}>
                    {new Date(
                      item.messages[item.messages.length - 1]?.createdAt
                    ).toLocaleDateString()}
                  </Text>
                </View>
              </Pressable>
            )}
          ></FlatList>
        </View>
      </SafeAreaView>
    </React.Fragment>
  );
}

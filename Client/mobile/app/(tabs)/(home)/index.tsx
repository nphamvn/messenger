import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Link, Stack, router } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { appConfig } from "../../../constants/appConfig";
import { Conversation } from "../../../schemas/Conversation";
import { useQuery } from "@realm/react";
import React from "react";
import useAppDelegate from "../../../hooks/useAppDelegate";

export default function ConversationsScreen() {
  const { user } = useAppDelegate();
  const { getCredentials } = useAuth0();
  const convesations = useQuery(Conversation);

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
    console.log("data: ", data);
  };

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
            data={convesations}
            renderItem={({ item }) => {
              const otherMembers = item.members.filter(
                (u) => u.id !== user?.id
              );
              return (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: "/chat",
                      params: {
                        cId: item.cId.toString(),
                      },
                    });
                  }}
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
                      source={{ uri: otherMembers[0]?.picture }}
                      style={{ height: 40, width: 40, borderRadius: 20 }}
                    />
                    <View style={{ marginLeft: 4 }}>
                      <Text>{otherMembers[0]?.fullName}</Text>
                      {/* <Text style={{ marginTop: 2 }}>
                    {item.messages[item.messages.length - 1]?.text}
                  </Text> */}
                    </View>
                    {/* <Text style={{ marginStart: "auto" }}>
                  {new Date(
                    item.messages[item.messages.length - 1]?.createdAt
                  ).toLocaleDateString()}
                </Text> */}
                  </View>
                </TouchableOpacity>
              );
            }}
          ></FlatList>
        </View>
      </SafeAreaView>
    </React.Fragment>
  );
}

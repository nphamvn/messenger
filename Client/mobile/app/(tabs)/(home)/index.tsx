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
import { router } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { Conversation } from "../../../models/Conversation";
import { appConfig } from "../../../constants/appConfig";

export default function ConversationsScreen() {
  const { getCredentials } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={conversations}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "./chat",
                  params: {
                    conversationId: item.id,
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
                  source={{ uri: item.members[0]?.picture }}
                  style={{ height: 40, width: 40, borderRadius: 20 }}
                />
                <View style={{ marginLeft: 4 }}>
                  <Text>{item.members[0]?.fullName}</Text>
                  <Text style={{ marginTop: 2 }}>{item.lastMessage.text}</Text>
                </View>
                <Text style={{ marginStart: "auto" }}>
                  {new Date(item.lastMessage.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          )}
        ></FlatList>
      </View>
    </SafeAreaView>
  );
}

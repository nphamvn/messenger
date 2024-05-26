import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Conversation } from "../../models/Conversation";
import { router } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { appConfig } from "../../constants/constants";

export default function ConversationsScreen() {
  const { getCredentials } = useAuth0();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    (async () => {
      const credentials = await getCredentials();
      const response = await fetch(`${appConfig.API_URL}/conversations`, {
        headers: {
          Authorization: `Bearer ${credentials?.accessToken}`,
        },
      });
      const data = await response.json();
      setConversations(data);
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
        <FlatList
          data={conversations}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "conversation/chat",
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
                  borderBottomColor: "gray",
                  borderBottomWidth: 1,
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

import { useEffect, useState } from "react";
import { View, Text, FlatList, Image, Pressable } from "react-native";
import { Conversation } from "../../models/Conversation";
import { router } from "expo-router";

const mockConversations: Conversation[] = [
  {
    id: 1,
    users: [
      { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/300" },
      { id: "2", name: "Bob", avatar: "https://i.pravatar.cc/301" },
    ],
    lastMessage: {
      id: 1,
      text: "Hello",
      sender: { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/300" },
      createdAt: new Date(),
    },
  },
  {
    id: 2,
    users: [
      { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/300" },
      { id: "3", name: "Charlie", avatar: "https://i.pravatar.cc/302" },
    ],
    lastMessage: {
      id: 2,
      text: "Hi",
      sender: { id: "3", name: "Charlie", avatar: "https://i.pravatar.cc/302" },
      createdAt: new Date(),
    },
  },
  {
    id: 3,
    users: [
      { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/300" },
      { id: "4", name: "David", avatar: "https://i.pravatar.cc/303" },
    ],
    lastMessage: {
      id: 3,
      text: "Hey",
      sender: { id: "4", name: "David", avatar: "https://i.pravatar.cc/303" },
      createdAt: new Date(),
    },
  },
];

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  return (
    <FlatList
      style={{ flex: 1, padding: 10 }}
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
            style={{ flexDirection: "row", display: "flex", marginBottom: 10 }}
          >
            <Image
              source={{ uri: item.users[0].avatar }}
              style={{ height: 40, width: 40, borderRadius: 18 }}
            />
            <View style={{ marginLeft: 4 }}>
              <Text>{item.users[0].name}</Text>
              <Text>{item.lastMessage.text}</Text>
            </View>
          </View>
        </Pressable>
      )}
    ></FlatList>
  );
}

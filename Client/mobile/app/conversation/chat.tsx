import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  Pressable,
} from "react-native";
import Message from "../../models/Message";

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");

  useEffect(() => {
    // This is a mock implementation of fetching messages
    const mockMessages: Message[] = [
      {
        id: 1,
        text: "Hello",
        sender: { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/300" },
        createdAt: new Date(),
      },
      {
        id: 2,
        text: "Hi",
        sender: {
          id: "3",
          name: "Charlie",
          avatar: "https://i.pravatar.cc/302",
        },
        createdAt: new Date(),
      },
      {
        id: 3,
        text: "Hey",
        sender: { id: "4", name: "David", avatar: "https://i.pravatar.cc/303" },
        createdAt: new Date(),
      },
    ];

    setMessages(mockMessages);
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, padding: 40, width: "100%" }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View>
            <Text>{item.text}</Text>
          </View>
        )}
      ></FlatList>
      <View
        style={{
          bottom: 30,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message"
        ></TextInput>
        <Pressable
          onPress={() => {
            // This is a mock implementation of sending a message
            const newMessage: Message = {
              id: 4,
              text: text,
              sender: {
                id: "1",
                name: "Alice",
                avatar: "https://i.pravatar.cc/300",
              },
              createdAt: new Date(),
            };
            setMessages([...messages, newMessage]);
            setText("");
          }}
        >
          <Text>Send</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

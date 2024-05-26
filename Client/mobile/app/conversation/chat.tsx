import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import Message from "../../models/Message";
import { Conversation } from "../../models/Conversation";
import { useAuth0 } from "react-native-auth0";
import ConnectionContext from "../../hooks/ConnectionContext";
import { appConfig } from "../../constants/constants";
import uuid from "react-native-uuid";
import { useRealm } from "@realm/react";
import { Message as MessageSchema } from "../../schemas/Message";

export default function ChatScreen() {
  const { getCredentials, user } = useAuth0();
  const realm = useRealm();
  const { conversationId, userId } = useLocalSearchParams<{
    conversationId?: string;
    userId?: string;
  }>();
  const [conversation, setConversation] = useState<Conversation>();
  const me = conversation?.members.find((m) => m.id === user?.sub);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const messageInputRef = useRef<TextInput>(null);
  const connection = useContext(ConnectionContext)!;

  useEffect(() => {
    (async () => {
      const { accessToken } = (await getCredentials())!;
      if (conversationId) {
        {
          const response = await fetch(
            `${appConfig.API_URL}/conversations/${conversationId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const data = await response.json();
          setConversation(data);
        }
        {
          const response = await fetch(
            `${appConfig.API_URL}/conversations/${conversationId}/messages`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const data = await response.json();
          setMessages(data);
        }
      } else if (userId) {
        const response = await fetch(
          `${appConfig.API_URL}/conversations/o2o/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
        } else if (response.status === 404) {
          console.log("No conversation found with this user: ", userId);
        }
      } else {
        throw new Error(
          "Either conversationId or userId must be provided as a query parameter"
        );
      }
    })();
  }, []);

  useEffect(() => {
    connection.on("ReceiveMessage", (message: Message) => {
      console.log("Received message: ", message);
    });

    return () => {
      connection.off("ReceiveMessage");
    };
  }, []);

  const sendMessage = async () => {
    realm.write(() => {
      return realm.create(MessageSchema, {
        text: text,
        status: "notSent",
        conversationId: conversationId ? parseInt(conversationId) : null,
        userId: userId ? userId : null,
      });
    });
    const message: Message = {
      id: 0,
      text: text,
      senderId: me?.id!,
      createdAt: new Date().toDateString(),
      clientId: uuid.v4().toString(),
    };

    // connection
    //   .invoke(
    //     "SendMessage",
    //     conversationId ? parseInt(conversationId) : null,
    //     userId
    //       ? [userId].join(",")
    //       : conversation?.members.map((m) => m.id).join(","),
    //     text,
    //     null
    //   )
    //   .then(() => {
    //     console.log("Message sent");
    //   })
    //   .catch((error) => {
    //     console.error("Error sending message: ", error);
    //   })
    //   .finally(() => {
    //     setText("");
    //     messageInputRef.current?.focus();

    //     setMessages([...messages, message]);
    //   });
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
        <FlatList
          data={messages}
          renderItem={({ item }) =>
            item.senderId === me?.id ? (
              <View style={[styles.messageWrapper, styles.sentWrapper]}>
                <View style={[styles.messageBubble, styles.sent]}>
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.messageWrapper}>
                <Image
                  source={{
                    uri: conversation?.members.find(
                      (m) => m.id === item.senderId
                    )?.picture,
                  }}
                  style={styles.userImage}
                />
                <View style={[styles.messageBubble, styles.received]}>
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              </View>
            )
          }
        ></FlatList>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flexDirection: "row",
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  padding: 10,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  marginRight: 10,
                }}
                ref={messageInputRef}
              ></TextInput>
              <Pressable style={{ margin: "auto" }} onPress={sendMessage}>
                <Text style={{ color: "" }}>Send</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    padding: 10,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 10,
  },
  sentWrapper: {
    flexDirection: "row-reverse",
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    maxWidth: "70%",
    position: "relative",
  },
  messageText: {
    color: "#000",
  },
  sent: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  received: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  tail: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  sentTail: {
    top: 0,
    right: -10,
    borderLeftWidth: 10,
    borderLeftColor: "#dcf8c6",
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderBottomWidth: 10,
    borderBottomColor: "transparent",
  },
  receivedTail: {
    top: 0,
    left: -10,
    borderRightWidth: 10,
    borderRightColor: "#fff",
    borderTopWidth: 10,
    borderTopColor: "transparent",
    borderBottomWidth: 10,
    borderBottomColor: "transparent",
  },
});

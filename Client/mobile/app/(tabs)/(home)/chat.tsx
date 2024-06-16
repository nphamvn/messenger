import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Button,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Message } from "@schemas/index";
import useAppDelegate from "@hooks/useAppDelegate";
import useConversation from "@hooks/useConversation";

export default function Screen() {
  const { user } = useAppDelegate();

  const { cId, uId, returnScreen } = useLocalSearchParams<{
    cId?: string;
    uId?: string;
    returnScreen?: string;
  }>();

  const { conversation, messages, sendMessage, deleteMessage, users } =
    useConversation(cId, uId);

  const [messageText, setMessageText] = useState<string>();
  const messageInputRef = useRef<TextInput>(null);

  const [messageContextModalVisible, setMessageContextModalVisible] =
    useState(false);

  const [
    messageDeleteConfirmationModalVisible,
    setMessageDeleteConfirmationModalVisible,
  ] = useState(false);

  const refs = useRef({} as Record<string, TouchableOpacity | null>);
  const measure = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageX: number;
    pageY: number;
  } | null>(null);

  const message = useRef<Message | null>(null);

  const [messageContextModalStyles, setMessageContextModalStyles] = useState(
    {}
  );

  useEffect(() => {
    if (!messageContextModalVisible || !measure.current) {
      setMessageContextModalStyles({});
    }
    const isMyMessage = message.current?.sender.id === user?.id;
    if (isMyMessage) {
      setMessageContextModalStyles({ right: 20 });
    } else {
      setMessageContextModalStyles({ left: 20 });
    }
  }, [messageContextModalVisible, message.current]);

  const handleSendMessagePress = async () => {
    if (!messageText) {
      return;
    }
    await sendMessage(messageText);
    setMessageText("");
    messageInputRef.current?.focus();
  };
  const router = useRouter();
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: users
        .filter((m) => m.id !== user?.id)
        .map((m) => m.fullName + "(" + m.id + ")")
        .join(", "),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (returnScreen) {
              router.navigate(returnScreen);
            } else {
              router.back();
            }
          }}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, users, returnScreen]);
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
          <FlatList
            data={messages.map((m) => ({ ...m } as Message))}
            renderItem={({ item }) => {
              const isMyMessage = item.sender.id === user?.id;
              return (
                <TouchableOpacity
                  ref={(ref) => (refs.current[item.cId.toString()] = ref)}
                  onLongPress={() => {
                    console.log("Long press on message", item);
                    message.current = item;
                    refs.current[item.cId.toString()]?.measure(
                      (x, y, width, height, pageX, pageY) => {
                        console.log({ x, y, width, height, pageX, pageY });
                        measure.current = { x, y, width, height, pageX, pageY };
                        setMessageContextModalVisible(true);
                      }
                    );
                  }}
                >
                  {isMyMessage ? (
                    <View style={[styles.messageWrapper, styles.sentWrapper]}>
                      <View style={[styles.messageBubble, styles.sent]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                      </View>
                      <Text style={styles.status}>{item.status}</Text>
                    </View>
                  ) : (
                    <View style={styles.messageWrapper}>
                      <Image
                        source={{
                          uri: conversation?.members.find(
                            (m) => m.id === item.sender?.id
                          )?.picture,
                        }}
                        style={styles.userImage}
                      />
                      <View style={[styles.messageBubble, styles.received]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
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
                  value={messageText}
                  onChangeText={setMessageText}
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
                <Button
                  disabled={!messageText}
                  onPress={handleSendMessagePress}
                  title="Send"
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
      <Modal visible={messageContextModalVisible} transparent>
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
          }}
          onPress={() => {
            setMessageContextModalVisible(false);
          }}
        >
          <View style={modalStyles.backdrop}>
            <View
              style={{
                position: "absolute",
                top: measure.current
                  ? measure.current.pageY + measure.current.height
                  : undefined,
                ...messageContextModalStyles,
                backgroundColor: "#fff",
                padding: 10,
                borderRadius: 10,
                width: 200,
                height: 200,
              }}
            >
              <TouchableOpacity
                style={{
                  padding: 10,
                }}
                onPress={() => {
                  console.log("Delete message");
                  setMessageDeleteConfirmationModalVisible(true);
                }}
              >
                <Text
                  style={{
                    color: "red",
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        <Modal visible={messageDeleteConfirmationModalVisible} transparent>
          <TouchableOpacity
            activeOpacity={1}
            style={{
              flex: 1,
            }}
            onPress={() => {
              setMessageDeleteConfirmationModalVisible(false);
              setMessageContextModalVisible(false);
            }}
          >
            <SafeAreaView
              style={{
                flex: 1,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    padding: 10,
                  }}
                >
                  Are you sure you want to delete this message?
                </Text>
                <TouchableOpacity
                  style={{
                    padding: 10,
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    if (message.current) {
                      await deleteMessage(message.current.cId.toString());
                    }
                    setMessageDeleteConfirmationModalVisible(false);
                    setMessageContextModalVisible(false);
                  }}
                >
                  <Text
                    style={{
                      color: "red",
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});

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
  status: {
    color: "#777",
    fontSize: 12,
    marginLeft: 10,
  },
});

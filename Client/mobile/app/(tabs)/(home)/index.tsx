import { useCallback, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Button,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { Link, useNavigation, useRouter } from "expo-router";
import { Conversation } from "@schemas/Conversation";
import { useQuery } from "@realm/react";
import React from "react";
import useAppDelegate from "@hooks/useAppDelegate";

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAppDelegate();
  const convesations = useQuery(Conversation);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    (async () => {
      setRefreshing(false);
    })();
  }, []);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
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
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <FlatList
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={convesations}
        renderItem={({ item }) => {
          const otherMembers = item.members.filter((u) => u.id !== user?.id);
          return (
            <TouchableOpacity
              onPress={() => {
                router.navigate({
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
                  <Text style={{ marginTop: 2 }}>
                    (cId: {item.cId.toString()}, sId: {item.sId?.toString()})
                  </Text>
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
      />
    </View>
  );
}

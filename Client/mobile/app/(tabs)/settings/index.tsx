import {
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  View,
  Image,
} from "react-native";
import useAppDelegate from "@hooks/useAppDelegate";
import { useAuth0 } from "react-native-auth0";
import { useRealm } from "@realm/react";
import { Link } from "expo-router";

export default function SettingsScreen() {
  const { clearSession } = useAuth0();
  const { user } = useAppDelegate();
  const realm = useRealm();

  const onPressLogout = async () => {
    Alert.alert("Logout confirm", "Are you sure you want to logout?", [
      {
        text: "Cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          await clearSession();
        },
      },
    ]);
  };

  const handleResetPress = () => {
    Alert.alert("Reset confirm", "Are you sure you want to reset all?", [
      {
        text: "Cancel",
      },
      {
        text: "Reset",
        onPress: () => {
          realm.write(() => {
            realm.deleteAll();
          });
        },
      },
    ]);
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: user?.picture }}
            style={{ height: 60, width: 60, borderRadius: 25 }}
          />
          <View>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {user?.fullName}
            </Text>
            <Text>{user?.id}</Text>
          </View>
        </View>
        <View
          style={{
            marginTop: "auto",
          }}
        >
          <Link href={"_sitemap"}>_sitemap</Link>
          <Pressable
            style={{
              padding: 14,
              backgroundColor: "white",
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={onPressLogout}
          >
            <Text style={{ color: "red" }}>Logout</Text>
          </Pressable>
          <Pressable
            style={{
              padding: 14,
              backgroundColor: "white",
              borderRadius: 8,
            }}
            onPress={handleResetPress}
          >
            <Text style={{ color: "red" }}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
